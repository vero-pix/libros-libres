"use client";

import { createClient } from "@/lib/supabase/client";

type Provider = "apple" | "google" | "linkedin_oidc";

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

      <div className="grid grid-cols-1 gap-2.5">
        {/* Google */}
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 py-2.5 border border-cream-dark/40 rounded-xl text-sm font-medium text-ink-muted cursor-not-allowed opacity-60 bg-white"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.705A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.037l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.963L3.964 7.295C4.672 5.168 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Google <span className="text-[10px] text-ink-muted ml-1 font-normal">(próximamente)</span>
        </button>

        {/* LinkedIn */}
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 py-2.5 border border-cream-dark/40 rounded-xl text-sm font-medium text-ink-muted cursor-not-allowed opacity-60 bg-white"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="#0077B5">
            <path d="M16 0H2C0.895 0 0 0.895 0 2v14c0 1.105 0.895 2 2 2h14c1.105 0 2-0.895 2-2V2c0-1.105-0.895-2-2-2zM5.333 15.333H2.667V6.667h2.667v8.666zM4 5.333c-0.854 0-1.547-0.693-1.547-1.547s0.693-1.547 1.547-1.547c0.854 0 1.547 0.693 1.547 1.547S4.854 5.333 4 5.333zM15.333 15.333h-2.667v-4.167c0-0.993-0.02-2.271-1.384-2.271-1.385 0-1.597 1.082-1.597 2.198v4.24h-2.667V6.667h2.56v1.183h0.036c0.356-0.675 1.227-1.386 2.524-1.386 2.7 0 3.2 1.777 3.2 4.088v4.781z"/>
          </svg>
          LinkedIn <span className="text-[10px] text-ink-muted ml-1 font-normal">(próximamente)</span>
        </button>

        {/* Apple */}
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 py-2.5 border border-cream-dark/40 rounded-xl text-sm font-medium text-ink-muted cursor-not-allowed opacity-60 bg-white"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <path d="M14.94 9.88c-.02-2.16 1.76-3.2 1.84-3.25-1-1.47-2.57-1.67-3.12-1.7-1.33-.13-2.6.79-3.27.79-.67 0-1.72-.77-2.82-.75a4.16 4.16 0 0 0-3.5 2.14c-1.5 2.59-.38 6.43 1.07 8.53.71 1.03 1.56 2.18 2.68 2.14 1.07-.04 1.48-.7 2.78-.7 1.3 0 1.67.7 2.78.67 1.16-.02 1.89-1.05 2.6-2.08a8.6 8.6 0 0 0 1.18-2.42 3.5 3.5 0 0 1-2.12-3.22zM12.4 3.54A3.56 3.56 0 0 0 13.22.5a3.63 3.63 0 0 0-2.34 1.21 3.39 3.39 0 0 0-.84 2.46c.92.07 1.86-.43 2.36-1.13z" />
          </svg>
          Apple <span className="text-[10px] text-ink-muted ml-1 font-normal">(próximamente)</span>
        </button>
      </div>
    </div>
  );
}
