"use client";

import { createClient } from "@/lib/supabase/client";

type Provider = "apple";

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
    </div>
  );
}
