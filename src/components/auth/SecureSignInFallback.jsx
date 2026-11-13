import React from "react";
import { SIGN_IN_ON_PLATFORM_URL } from "@/lib/providerSignIn";

/**
 * Guaranteed way in when the custom domain's sign-in misbehaves: the platform
 * app origin always completes the handshake. Shown only off the platform host.
 */
export default function SecureSignInFallback() {
  const [onCustomDomain, setOnCustomDomain] = React.useState(false);

  React.useEffect(() => {
    const host = window.location.hostname;
    setOnCustomDomain(!(host === "base44.app" || host.endsWith(".base44.app")));
  }, []);

  if (!onCustomDomain) return null;

  return (
    <div className="mt-6 pt-5 border-t border-border text-center">
      <a
        href={SIGN_IN_ON_PLATFORM_URL}
        className="text-xs font-bold underline"
        style={{ color: "#f5d623" }}
      >
        Button not responding? Open the secure sign-in page
      </a>
    </div>
  );
}