// Minimal stored-ZIP EPUB builder (no external dependencies)
// Creates valid EPUB 2.0 files with stored (uncompressed) entries

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function strToBytes(str) {
  return new TextEncoder().encode(str);
}

function escapeXml(str) {
  return String(str || '').replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[c]));
}

function textToParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `    <p>${escapeXml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
}

function buildZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = strToBytes(file.name);
    const data = file.data instanceof Uint8Array ? file.data : strToBytes(String(file.data));
    const crc = crc32(data);
    const size = data.length;

    // Local file header
    const lh = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); // stored, no compression
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x0021, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    lh.set(nameBytes, 30);
    localParts.push(lh, data);

    // Central directory record
    const ch = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x0021, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    ch.set(nameBytes, 46);
    centralParts.push(ch);

    offset += lh.length + data.length;
  }

  const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
  const centralOffset = offset;

  // End of central directory
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralOffset, true);
  ev.setUint16(20, 0, true);

  const all = [...localParts, ...centralParts, eocd];
  const total = all.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const part of all) {
    result.set(part, pos);
    pos += part.length;
  }
  return result;
}

export function buildEpub(title, author, chapters) {
  const files = [];

  // mimetype must be first, stored without compression
  files.push({ name: 'mimetype', data: strToBytes('application/epub+zip') });

  // container.xml
  files.push({
    name: 'META-INF/container.xml',
    data: strToBytes('<?xml version="1.0" encoding="UTF-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'),
  });

  // CSS
  files.push({
    name: 'OEBPS/style.css',
    data: strToBytes('body{font-family:serif;line-height:1.6;margin:5%}h1{text-align:center;margin-bottom:1em}p{text-indent:1.5em;margin:0 0 0.5em}p:first-of-type{text-indent:0}'),
  });

  // Chapter XHTML files
  chapters.forEach((ch, i) => {
    const num = String(i + 1).padStart(3, '0');
    files.push({
      name: `OEBPS/chapter${num}.xhtml`,
      data: strToBytes(`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeXml(ch.title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head><body><h1>${escapeXml(ch.title)}</h1>\n${textToParagraphs(ch.content)}\n</body></html>`),
    });
  });

  // content.opf
  const manifest = [
    '<item id="style" href="style.css" media-type="text/css"/>',
    ...chapters.map((_, i) => {
      const num = String(i + 1).padStart(3, '0');
      return `<item id="chap${num}" href="chapter${num}.xhtml" media-type="application/xhtml+xml"/>`;
    }),
  ].join('\n    ');
  const spine = chapters.map((_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return `<itemref idref="chap${num}"/>`;
  }).join('\n    ');
  const uid = `lexio-${Date.now()}`;

  files.push({
    name: 'OEBPS/content.opf',
    data: strToBytes(`<?xml version="1.0" encoding="UTF-8"?>\n<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="bookid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${escapeXml(title)}</dc:title><dc:creator>${escapeXml(author)}</dc:creator><dc:language>en</dc:language><dc:identifier id="bookid">${uid}</dc:identifier></metadata><manifest><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n    ${manifest}</manifest><spine toc="ncx">\n    ${spine}\n    </spine></package>`),
  });

  // toc.ncx
  const navPoints = chapters.map((ch, i) => {
    const num = String(i + 1).padStart(3, '0');
    return `<navPoint id="nav${i + 1}" playOrder="${i + 1}"><navLabel><text>${escapeXml(ch.title)}</text></navLabel><content src="chapter${num}.xhtml"/></navPoint>`;
  }).join('\n    ');

  files.push({
    name: 'OEBPS/toc.ncx',
    data: strToBytes(`<?xml version="1.0" encoding="UTF-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${uid}"/></head><docTitle><text>${escapeXml(title)}</text></docTitle><navMap>\n    ${navPoints}\n    </navMap></ncx>`),
  });

  const zipData = buildZip(files);
  return new Blob([zipData], { type: 'application/epub+zip' });
}

export async function downloadBlob(blob, filename) {
  // iOS / mobile: use Web Share API to open the native share sheet (Save to Files, AirDrop, etc.)
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  // Fallback: anchor download (desktop browsers)
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 4000);
}

export async function downloadEpub(title, author, chapters) {
  const blob = buildEpub(title, author, chapters);
  await downloadBlob(blob, `${title.replace(/[^a-zA-Z0-9]/g, '_')}.epub`);
}