import React from "react";

export default function MicrosoftIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 23 23" aria-hidden="true">
      <path d="M1 1h10v10H1z" fill="#f25022" />
      <path d="M12 1h10v10H12z" fill="#7fba00" />
      <path d="M1 12h10v10H1z" fill="#00a4ef" />
      <path d="M12 12h10v10H12z" fill="#ffb900" />
    </svg>
  );
}