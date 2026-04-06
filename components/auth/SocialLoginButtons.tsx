"use client";

import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "apple" | "linkedin_oidc";

export default function SocialLoginButtons() {
  const supabase = createClient();

  async function handleOAuth(provider: Provider) {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  return (
    <div className="space-y-2.5">
      <div className="relative flex items-center gap-3 my-5">
        <div className="flex-1 border-t border-cream-dark/40" />
        <span className="text-xs text-ink-muted">o continúa con</span>
        <div className="flex-1 border-t border-cream-dark/40" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        className="w-full flex items-center justify-center gap-3 py-2.5 border border-cream-dark/40 rounded-xl text-sm font-medium text-ink hover:bg-cream-warm transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92A8.78 8.78 0 0 0 17.64 9.2z" fill="#4285F4" />
          <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26a5.4 5.4 0 0 1-3.04.86 5.32 5.32 0 0 1-5-3.67H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853" />
          <path d="M4 10.75a5.41 5.41 0 0 1 0-3.5V4.92H.96a9 9 0 0 0 0 8.16L4 10.75z" fill="#FBBC05" />
          <path d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.59A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .96 4.92L4 7.25A5.36 5.36 0 0 1 9 3.58z" fill="#EA4335" />
        </svg>
        Google
      </button>

      {/* Apple */}
      <button
        type="button"
        disabled
        className="w-full flex items-center justify-center gap-3 py-2.5 border border-cream-dark/40 rounded-xl text-sm font-medium text-ink-muted cursor-not-allowed opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M14.94 9.88c-.02-2.16 1.76-3.2 1.84-3.25-1-1.47-2.57-1.67-3.12-1.7-1.33-.13-2.6.79-3.27.79-.67 0-1.72-.77-2.82-.75a4.16 4.16 0 0 0-3.5 2.14c-1.5 2.59-.38 6.43 1.07 8.53.71 1.03 1.56 2.18 2.68 2.14 1.07-.04 1.48-.7 2.78-.7 1.3 0 1.67.7 2.78.67 1.16-.02 1.89-1.05 2.6-2.08a8.6 8.6 0 0 0 1.18-2.42 3.5 3.5 0 0 1-2.12-3.22zM12.4 3.54A3.56 3.56 0 0 0 13.22.5a3.63 3.63 0 0 0-2.34 1.21 3.39 3.39 0 0 0-.84 2.46c.92.07 1.86-.43 2.36-1.13z" />
        </svg>
        Apple <span className="text-[10px] text-ink-muted ml-1">pronto</span>
      </button>

      {/* LinkedIn */}
      <button
        type="button"
        onClick={() => handleOAuth("linkedin_oidc")}
        className="w-full flex items-center justify-center gap-3 py-2.5 border border-cream-dark/40 rounded-xl text-sm font-medium text-ink hover:bg-cream-warm transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="#0A66C2">
          <path d="M15.34 0H2.66A2.66 2.66 0 0 0 0 2.66v12.68A2.66 2.66 0 0 0 2.66 18h12.68A2.66 2.66 0 0 0 18 15.34V2.66A2.66 2.66 0 0 0 15.34 0zM5.34 15.34H2.66V6.75h2.68v8.59zM4 5.68a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1zm11.34 9.66h-2.68V11.1c0-1.01-.02-2.32-1.41-2.32-1.42 0-1.63 1.1-1.63 2.24v4.32H6.94V6.75h2.57v1.17h.04a2.82 2.82 0 0 1 2.54-1.4c2.72 0 3.22 1.79 3.22 4.12v4.7z" />
        </svg>
        LinkedIn
      </button>
    </div>
  );
}
