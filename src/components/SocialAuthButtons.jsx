import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import MicrosoftIcon from "@/components/MicrosoftIcon";
import FacebookIcon from "@/components/FacebookIcon";

export default function SocialAuthButtons({ redirectTo = "/" }) {
  const [oauthLoading, setOauthLoading] = useState(null);
  const [error, setError] = useState("");

  // Detect OAuth error redirect back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error") || params.get("auth_error");
    if (oauthError) {
      const provider = params.get("provider") || "social";
      setError(`${provider === "apple" ? "Apple" : provider === "google" ? "Google" : provider === "microsoft" ? "Microsoft" : provider === "facebook" ? "Facebook" : "Social"} sign-in failed: ${oauthError}. Please try again or use email/password.`);
      params.delete("error");
      params.delete("auth_error");
      params.delete("provider");
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleProvider = (provider) => {
    setOauthLoading(provider);
    setError("");
    try {
      base44.auth.loginWithProvider(provider, window.location.origin + redirectTo);
    } catch (err) {
      setError(`${provider === "apple" ? "Apple" : provider === "google" ? "Google" : provider === "microsoft" ? "Microsoft" : "Facebook"} sign-in failed to start. Please try again.`);
      setOauthLoading(null);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-3"
        onClick={() => handleProvider("google")}
        disabled={!!oauthLoading}
      >
        {oauthLoading === "google" ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <GoogleIcon className="w-5 h-5 mr-2" />
        )}
        Continue with Google
      </Button>

      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-3"
        onClick={() => handleProvider("apple")}
        disabled={!!oauthLoading}
      >
        {oauthLoading === "apple" ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <AppleIcon className="w-5 h-5 mr-2" />
        )}
        Continue with Apple
      </Button>

      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-3"
        onClick={() => handleProvider("microsoft")}
        disabled={!!oauthLoading}
      >
        {oauthLoading === "microsoft" ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <MicrosoftIcon className="w-5 h-5 mr-2" />
        )}
        Continue with Microsoft
      </Button>

      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={() => handleProvider("facebook")}
        disabled={!!oauthLoading}
      >
        {oauthLoading === "facebook" ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <FacebookIcon className="w-5 h-5 mr-2" />
        )}
        Continue with Facebook
      </Button>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
    </>
  );
}