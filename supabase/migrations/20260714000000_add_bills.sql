-- Create public.bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE restrict,
  title text NOT NULL,
  amount_in_cents integer NOT NULL,
  due_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  type text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast restaurant lookups
CREATE INDEX IF NOT EXISTS bills_restaurant_id_idx ON public.bills(restaurant_id);
