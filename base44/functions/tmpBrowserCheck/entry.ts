import { createClientFromRequest } from 'npm:@base44/sdk@0.8.56';
import { Stagehand } from 'npm:@browserbasehq/stagehand@3.7.3';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const session = await base44.asServiceRole.browser.getSession();
  let stagehand;
  const shots: { label: string; file_uri: string }[] = [];
  try {
    const { baseURL, token, headers } = base44.asServiceRole.aiGateway.connection();
    stagehand = new Stagehand({
      env: 'LOCAL',
      localBrowserLaunchOptions: { cdpUrl: session.connectionUrl },
      model: { modelName: 'openai/gpt_6_luna', apiKey: token, baseURL, headers, openaiEndpointFormat: 'chat' },
      disablePino: true,
    });
    await stagehand.init();
    const page = stagehand.context.pages()[0];
    const signed = body.file_uri
      ? (await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: body.file_uri, expires_in: 1800 })).signed_url
      : body.video;
    const html = `<html><body style="margin:0;background:#000">
      <video id="v" src="${signed}" style="width:100vw;height:auto;display:block" muted playsinline></video>
    </body></html>`;
    await page.goto('about:blank');
    await page.evaluate((h: string) => {
      document.open();
      document.write(h);
      document.close();
    }, [html]);
    const duration = await page.evaluate(() => new Promise<number>((resolve) => {
      const v = document.getElementById('v') as HTMLVideoElement;
      if (!v) return resolve(-1);
      if (v.readyState >= 1) return resolve(v.duration);
      v.onloadedmetadata = () => resolve(v.duration);
      v.onerror = () => resolve(-2);
      setTimeout(() => resolve(-3), 15000);
    }));
    const times: number[] = body.times || [];
    for (const t of times) {
      await page.evaluate((time: number) => new Promise<void>((resolve) => {
        const v = document.getElementById('v') as HTMLVideoElement;
        v.onseeked = () => resolve();
        v.currentTime = time;
        setTimeout(() => resolve(), 6000);
      }), [t]);
      await new Promise((r) => setTimeout(r, 700));
      const buf = await page.screenshot({ type: 'png', fullPage: false });
      const up = await base44.asServiceRole.integrations.Core.UploadPrivateFile({
        file: new File([buf], `frame_${Math.round(t)}.png`, { type: 'image/png' }),
      });
      shots.push({ label: `t=${Math.round(t)}s`, file_uri: up.file_uri });
    }
    return Response.json({ duration, shots: shots.length, debug_screenshots: shots });
  } finally {
    await stagehand?.close().catch(() => {});
    await session.end();
  }
});