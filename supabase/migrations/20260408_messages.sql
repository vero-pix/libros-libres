-- Mensajería interna: conversaciones 1-a-1 entre usuarios

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES public.users(id),
  participant_2 UUID NOT NULL REFERENCES public.users(id),
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_participants CHECK (participant_1 <> participant_2),
  CONSTRAINT unique_conversation UNIQUE (participant_1, participant_2, listing_id)
);

CREATE INDEX conversations_p1_idx ON public.conversations(participant_1);
CREATE INDEX conversations_p2_idx ON public.conversations(participant_2);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participant sees conversation" ON public.conversations
  FOR SELECT USING (auth.uid() IN (participant_1, participant_2));

CREATE POLICY "User creates conversation" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IN (participant_1, participant_2));

CREATE POLICY "Participant updates conversation" ON public.conversations
  FOR UPDATE USING (auth.uid() IN (participant_1, participant_2));

-- Mensajes individuales

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 2000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_idx ON public.messages(conversation_id, created_at);
CREATE INDEX messages_unread_idx ON public.messages(conversation_id) WHERE read_at IS NULL;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participant sees messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND auth.uid() IN (c.participant_1, c.participant_2)
    )
  );

CREATE POLICY "Participant sends message" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND auth.uid() IN (c.participant_1, c.participant_2)
    )
  );

CREATE POLICY "Recipient marks read" ON public.messages
  FOR UPDATE USING (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND auth.uid() IN (c.participant_1, c.participant_2)
    )
  );
