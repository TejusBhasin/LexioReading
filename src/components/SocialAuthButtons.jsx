import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import MicrosoftIcon from "@/components/MicrosoftIcon";
import { startProviderSignIn } from "@/lib/authPaths";

const PROVIDER_LABELS = {
  google: "Google",
  apple: "Apple",
  microsoft: "Microsoft",
};

export default function SocialAuthButtons({ redirectTo = "/" }) {
  const [oauthLoading, setOauthLoading] = useState(null);
  const [error, setError] = useState("");

  // Detect OAuth error redirect back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error") || params.get("auth_error");
    if (oauthError) {
      const provider = params.get("provider") || "social";
      setError(`${PROVIDER_LABELS[provider] || "Social"} sign-in failed: ${oauthError}. Please try again or use email/password.`);
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
      startProviderSignIn(provider, redirectTo);
    } catch (err) {
      setError(`${PROVIDER_LABELS[provider] || "Social"} sign-in failed to start. Please try again.`);
      setOauthLoading(null);
    }
  };

  return (
    <>
      {["google", "apple", "microsoft"].map((provider, i) => (
        <Button
          key={provider}
          variant="outline"
          className={`w-full h-12 text-sm font-medium mb-3 ${i === 2 ? "mb-6" : ""}`}
          onClick={() => handleProvider(provider)}
          disabled={!!oauthLoading}
        >
          {oauthLoading === provider ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : provider === "google" ? (
            <GoogleIcon className="w-5 h-5 mr-2" />
          ) : provider === "apple" ? (
            <AppleIcon className="w-5 h-5 mr-2" />
          ) : (
            <MicrosoftIcon className="w-5 h-5 mr-2" />
          )}
          Continue with {PROVIDER_LABELS[provider]}
        </Button>
      ))}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
    </>
  );
}