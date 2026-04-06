"use client";

import { createClient } from "@/lib/supabase/client";

export default function SocialLoginButtons() {
  const supabase = createClient();

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  return (
    <div className="space-y-3">
      <div className="relative flex items-center gap-3 my-5">
        <div className="flex-1 border-t border-cream-dark/40" />
        <span className="text-xs text-ink-muted">o continúa con</span>
        <div className="flex-1 border-t border-cream-dark/40" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
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
    </div>
  );
}
