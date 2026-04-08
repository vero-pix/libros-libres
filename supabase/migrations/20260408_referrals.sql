-- Sistema de referidos: comprador trae vendedor → descuento en dispatch

CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.users(id),
  referral_code TEXT NOT NULL UNIQUE,
  referred_id UUID REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  -- pending: code created, no one used it yet
  -- completed: referred user registered
  -- rewarded: referrer got their discount
  reward_order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX referrals_code_idx ON public.referrals(referral_code);
CREATE INDEX referrals_referrer_idx ON public.referrals(referrer_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can see their own referrals
CREATE POLICY "User sees own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Authenticated users can create referrals
CREATE POLICY "User creates referral" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- System can update referral status (via service role)
CREATE POLICY "User updates own referral" ON public.referrals
  FOR UPDATE USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Add referral_code to users table for easy lookup
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id);
