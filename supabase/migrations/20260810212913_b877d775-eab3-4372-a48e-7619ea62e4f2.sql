CREATE TABLE public.prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.prizes TO anon, authenticated;
GRANT ALL ON public.prizes TO service_role;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prizes are publicly readable" ON public.prizes FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  prize_id uuid NOT NULL REFERENCES public.prizes(id) ON DELETE CASCADE,
  prize_name text NOT NULL,
  prize_position integer NOT NULL DEFAULT 1,
  full_name text NOT NULL,
  ticket_number integer NOT NULL,
  congregation text,
  regional text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id)
);

GRANT SELECT ON public.winners TO anon, authenticated;
GRANT ALL ON public.winners TO service_role;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Winners are publicly readable" ON public.winners FOR SELECT TO anon, authenticated USING (true);