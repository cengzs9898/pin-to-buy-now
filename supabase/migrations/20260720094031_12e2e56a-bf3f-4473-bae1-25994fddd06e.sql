
CREATE TABLE public.market_prices (
  id text PRIMARY KEY,
  product_id text NOT NULL,
  title text NOT NULL,
  brand text,
  image_url text,
  main_category text,
  menu_category text,
  market text NOT NULL,
  depot_id text,
  depot_name text,
  price numeric NOT NULL,
  unit_price text,
  index_time text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX market_prices_menu_category_idx ON public.market_prices (menu_category);
CREATE INDEX market_prices_market_idx ON public.market_prices (market);
CREATE INDEX market_prices_title_idx ON public.market_prices USING gin (to_tsvector('simple', title));

GRANT SELECT ON public.market_prices TO anon, authenticated;
GRANT ALL ON public.market_prices TO service_role;

ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market prices"
  ON public.market_prices FOR SELECT
  USING (true);
