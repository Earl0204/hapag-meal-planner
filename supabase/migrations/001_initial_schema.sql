-- =====================================================
-- HAPAG — Database Migration 001
-- Full Schema: Countries, Cuisines, Profiles,
--              Recipes, Pantry, Meal Plans,
--              Grocery Lists, Subscriptions,
--              Market Prices, Bantay Presyo
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text recipe search

-- =====================================================
-- COUNTRIES
-- =====================================================
CREATE TABLE public.countries (
  code            CHAR(2) PRIMARY KEY,
  name            TEXT NOT NULL,
  name_local      TEXT,
  currency_code   TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  flag_emoji      TEXT,
  default_locale  TEXT DEFAULT 'en',
  is_active       BOOLEAN DEFAULT FALSE,
  launched_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.countries VALUES
  ('PH', 'Philippines', 'Pilipinas', 'PHP', '₱', '🇵🇭', 'fil', TRUE, NOW()),
  ('ID', 'Indonesia', 'Indonesia', 'IDR', 'Rp', '🇮🇩', 'id', FALSE, NULL),
  ('MY', 'Malaysia', 'Malaysia', 'MYR', 'RM', '🇲🇾', 'ms', FALSE, NULL),
  ('SG', 'Singapore', 'Singapore', 'SGD', '$', '🇸🇬', 'en', FALSE, NULL);

-- =====================================================
-- CUISINES
-- =====================================================
CREATE TABLE public.cuisines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code    CHAR(2) REFERENCES public.countries(code),
  name            TEXT NOT NULL,
  name_local      TEXT,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  icon_emoji      TEXT,
  color_hex       TEXT,
  sort_order      INT DEFAULT 0,
  is_featured     BOOLEAN DEFAULT FALSE
);

INSERT INTO public.cuisines (country_code, name, name_local, slug, icon_emoji, color_hex, sort_order, is_featured) VALUES
  ('PH', 'Almusal', 'Almusal (Breakfast)', 'ph-almusal', '🌅', '#F5A623', 1, TRUE),
  ('PH', 'Ulam', 'Ulam (Main Dish)', 'ph-ulam', '🍖', '#E07A1F', 2, TRUE),
  ('PH', 'Merienda', 'Merienda (Snacks)', 'ph-merienda', '🥢', '#4CAF50', 3, TRUE),
  ('PH', 'Fiesta', 'Fiesta Dishes', 'ph-fiesta', '🎉', '#9C27B0', 4, TRUE),
  ('PH', 'Salo-Salo', 'Salo-Salo (Family)', 'ph-salo-salo', '👨‍👩‍👧‍👦', '#2196F3', 5, TRUE),
  ('PH', 'Pulutan', 'Pulutan (Bar Snacks)', 'ph-pulutan', '🍺', '#FF5722', 6, FALSE),
  ('PH', 'Panghimagas', 'Panghimagas (Desserts)', 'ph-desserts', '🍮', '#E91E63', 7, FALSE);

-- =====================================================
-- PROFILES (extends auth.users)
-- =====================================================
CREATE TABLE public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username                TEXT UNIQUE,
  display_name            TEXT,
  avatar_url              TEXT,
  country_code            CHAR(2) DEFAULT 'PH' REFERENCES public.countries(code),
  currency_code           TEXT DEFAULT 'PHP',
  language                TEXT DEFAULT 'fil',
  dietary_preferences     TEXT[] DEFAULT '{}',
  allergies               TEXT[] DEFAULT '{}',
  household_size          INT DEFAULT 3,
  cooking_skill           TEXT DEFAULT 'beginner'
    CHECK (cooking_skill IN ('beginner', 'intermediate', 'advanced')),
  preferred_meal_types    TEXT[] DEFAULT '{}',
  calorie_goal            INT,
  weekly_food_budget      DECIMAL(10, 2),
  plan                    TEXT DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'ultra')),
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT,
  subscription_status     TEXT DEFAULT 'inactive',
  subscription_period_end TIMESTAMPTZ,
  ai_credits_used         INT DEFAULT 0,
  ai_credits_limit        INT DEFAULT 0,
  onboarded               BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- AI credits increment function
CREATE OR REPLACE FUNCTION public.increment_ai_credits(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET ai_credits_used = ai_credits_used + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HOUSEHOLDS
-- =====================================================
CREATE TABLE public.households (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL DEFAULT 'Pamilya Ko',
  owner_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  country_code    CHAR(2) DEFAULT 'PH' REFERENCES public.countries(code),
  invite_code     TEXT UNIQUE NOT NULL DEFAULT upper(substring(gen_random_uuid()::text, 1, 6)),
  member_limit    INT DEFAULT 6,
  weekly_budget   DECIMAL(10, 2),
  currency_code   TEXT DEFAULT 'PHP',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.household_members (
  household_id    UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  nickname        TEXT,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (household_id, user_id)
);

-- =====================================================
-- RECIPES
-- =====================================================
CREATE TABLE public.recipes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code          CHAR(2) DEFAULT 'PH' REFERENCES public.countries(code),
  cuisine_id            UUID REFERENCES public.cuisines(id),
  author_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  spoonacular_id        INT UNIQUE,
  source                TEXT DEFAULT 'community',
  source_url            TEXT,
  title                 TEXT NOT NULL,
  title_local           TEXT,
  slug                  TEXT UNIQUE NOT NULL,
  description           TEXT,
  description_local     TEXT,
  image_url             TEXT,
  video_url             TEXT,
  cuisine_type          TEXT,
  region                TEXT,
  difficulty            TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  difficulty_local      TEXT,
  meal_type             TEXT[] DEFAULT '{}',
  dietary_tags          TEXT[] DEFAULT '{}',
  prep_time             INT,
  cook_time             INT,
  total_time            INT,
  servings              INT DEFAULT 4,
  cost_estimate_min     DECIMAL(10, 2),
  cost_estimate_max     DECIMAL(10, 2),
  cost_per_serving_min  DECIMAL(10, 2),
  cost_per_serving_max  DECIMAL(10, 2),
  cost_currency         TEXT DEFAULT 'PHP',
  cost_updated_at       TIMESTAMPTZ DEFAULT NOW(),
  calories_per_serving  INT,
  protein_g             DECIMAL(6, 2),
  carbs_g               DECIMAL(6, 2),
  fat_g                 DECIMAL(6, 2),
  fiber_g               DECIMAL(6, 2),
  instructions          JSONB NOT NULL DEFAULT '[]',
  tips                  TEXT[],
  mama_sita_products    TEXT[],
  is_platform_recipe    BOOLEAN DEFAULT FALSE,
  is_ai_generated       BOOLEAN DEFAULT FALSE,
  is_public             BOOLEAN DEFAULT TRUE,
  is_featured           BOOLEAN DEFAULT FALSE,
  view_count            INT DEFAULT 0,
  save_count            INT DEFAULT 0,
  cooked_count          INT DEFAULT 0,
  rating_avg            DECIMAL(3, 2) DEFAULT 0,
  rating_count          INT DEFAULT 0,
  seo_title             TEXT,
  seo_description       TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.recipe_ingredients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id       UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  name_local      TEXT,
  quantity        DECIMAL(10, 3),
  unit            TEXT,
  preparation     TEXT,
  is_optional     BOOLEAN DEFAULT FALSE,
  ingredient_group TEXT,
  estimated_price DECIMAL(10, 2),
  price_unit      TEXT,
  market_source   TEXT DEFAULT 'palengke',
  sort_order      INT DEFAULT 0
);

CREATE TABLE public.recipe_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id       UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text     TEXT,
  photo_url       TEXT,
  is_verified_cook BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (recipe_id, user_id)
);

-- =====================================================
-- PANTRY
-- =====================================================
CREATE TABLE public.pantry_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  household_id    UUID REFERENCES public.households(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  name_local      TEXT,
  category        TEXT,
  quantity        DECIMAL(10, 2),
  unit            TEXT,
  purchase_price  DECIMAL(10, 2),
  expiry_date     DATE,
  is_expired      BOOLEAN DEFAULT FALSE,
  location        TEXT DEFAULT 'ref' CHECK (location IN ('ref', 'freezer', 'pantry', 'counter')),
  barcode         TEXT,
  notes           TEXT,
  added_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SAVED RECIPES
-- =====================================================
CREATE TABLE public.saved_recipes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipe_id       UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  collection_name TEXT DEFAULT 'Mga Paborito',
  notes           TEXT,
  saved_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, recipe_id)
);

-- Enforce 10-recipe limit for free users
CREATE OR REPLACE FUNCTION check_saved_recipe_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan TEXT;
  saved_count INT;
BEGIN
  SELECT plan INTO user_plan FROM public.profiles WHERE id = NEW.user_id;
  IF user_plan = 'free' THEN
    SELECT COUNT(*) INTO saved_count FROM public.saved_recipes WHERE user_id = NEW.user_id;
    IF saved_count >= 10 THEN
      RAISE EXCEPTION 'I-upgrade sa Pro para sa unlimited na pag-save ng recipes. (Free plan limit: 10)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_saved_recipe_limit
  BEFORE INSERT ON public.saved_recipes
  FOR EACH ROW EXECUTE FUNCTION check_saved_recipe_limit();

-- =====================================================
-- MEAL PLANS
-- =====================================================
CREATE TABLE public.meal_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  household_id    UUID REFERENCES public.households(id) ON DELETE CASCADE,
  country_code    CHAR(2) DEFAULT 'PH' REFERENCES public.countries(code),
  title           TEXT DEFAULT 'Lingguhang Plano',
  week_start_date DATE NOT NULL,
  week_end_date   DATE NOT NULL,
  calorie_target  INT,
  weekly_budget   DECIMAL(10, 2),
  currency_code   TEXT DEFAULT 'PHP',
  dietary_filters TEXT[] DEFAULT '{}',
  is_ai_generated BOOLEAN DEFAULT FALSE,
  estimated_total_cost DECIMAL(10, 2),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'template')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.meal_plan_days (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  day_date        DATE NOT NULL,
  day_of_week     TEXT NOT NULL,
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('almusal', 'tanghalian', 'merienda', 'hapunan')),
  recipe_id       UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  custom_meal     TEXT,
  servings        INT DEFAULT 4,
  estimated_cost  DECIMAL(10, 2),
  notes           TEXT,
  is_cooked       BOOLEAN DEFAULT FALSE,
  cooked_at       TIMESTAMPTZ,
  UNIQUE (plan_id, day_date, meal_type)
);

-- =====================================================
-- GROCERY LISTS
-- =====================================================
CREATE TABLE public.grocery_lists (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  household_id          UUID REFERENCES public.households(id) ON DELETE CASCADE,
  meal_plan_id          UUID REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  title                 TEXT DEFAULT 'Listahan ng Grocery',
  status                TEXT DEFAULT 'active' CHECK (status IN ('active', 'shopping', 'completed', 'archived')),
  shop_date             DATE,
  total_estimated_cost  DECIMAL(10, 2),
  total_actual_cost     DECIMAL(10, 2),
  currency_code         TEXT DEFAULT 'PHP',
  preferred_store       TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.grocery_list_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id         UUID NOT NULL REFERENCES public.grocery_lists(id) ON DELETE CASCADE,
  recipe_id       UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  name_local      TEXT,
  category        TEXT,
  quantity        DECIMAL(10, 3),
  unit            TEXT,
  estimated_price DECIMAL(10, 2),
  actual_price    DECIMAL(10, 2),
  is_checked      BOOLEAN DEFAULT FALSE,
  checked_by      UUID REFERENCES public.profiles(id),
  checked_at      TIMESTAMPTZ,
  notes           TEXT,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NUTRITION LOGS
-- =====================================================
CREATE TABLE public.nutrition_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('almusal', 'tanghalian', 'merienda', 'hapunan')),
  recipe_id       UUID REFERENCES public.recipes(id),
  custom_food     TEXT,
  servings        DECIMAL(4, 2) DEFAULT 1,
  calories        INT,
  protein_g       DECIMAL(6, 2),
  carbs_g         DECIMAL(6, 2),
  fat_g           DECIMAL(6, 2),
  fiber_g         DECIMAL(6, 2),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- IMPORTED RECIPES (Ultra)
-- =====================================================
CREATE TABLE public.imported_recipes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_url      TEXT NOT NULL,
  platform        TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'website')),
  raw_transcript  TEXT,
  parsed_recipe   JSONB,
  recipe_id       UUID REFERENCES public.recipes(id),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'review_needed')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUBSCRIPTIONS & PAYMENTS
-- =====================================================
CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT UNIQUE,
  stripe_price_id         TEXT,
  plan_name               TEXT NOT NULL CHECK (plan_name IN ('free', 'pro', 'ultra')),
  status                  TEXT NOT NULL,
  billing_currency        TEXT DEFAULT 'PHP',
  amount                  DECIMAL(10, 2),
  billing_interval        TEXT,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at               TIMESTAMPTZ,
  canceled_at             TIMESTAMPTZ,
  trial_end               TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.payments (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES public.profiles(id),
  subscription_id             UUID REFERENCES public.subscriptions(id),
  stripe_payment_intent_id    TEXT UNIQUE,
  stripe_invoice_id           TEXT UNIQUE,
  amount                      DECIMAL(10, 2) NOT NULL,
  currency                    TEXT DEFAULT 'PHP',
  status                      TEXT NOT NULL,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AI USAGE
-- =====================================================
CREATE TABLE public.ai_generations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  generation_type TEXT NOT NULL,
  prompt_summary  TEXT,
  result_summary  TEXT,
  recipe_id       UUID REFERENCES public.recipes(id),
  model           TEXT DEFAULT 'gemini-1.5-flash',
  tokens_used     INT,
  status          TEXT DEFAULT 'success',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BANTAY PRESYO — MARKET PRICES
-- =====================================================
CREATE TABLE public.market_prices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_name  TEXT NOT NULL,
  commodity_key   TEXT NOT NULL,
  category        TEXT NOT NULL,
  country_code    CHAR(2) DEFAULT 'PH' REFERENCES public.countries(code),
  region          TEXT,
  market_type     TEXT DEFAULT 'palengke' CHECK (market_type IN ('palengke', 'supermarket', 'kadiwa', 'online')),
  price_min       DECIMAL(10, 2),
  price_max       DECIMAL(10, 2),
  price_avg       DECIMAL(10, 2),
  unit            TEXT DEFAULT 'kg',
  source          TEXT NOT NULL,
  source_url      TEXT,
  price_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  is_latest       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.price_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  commodity_key   TEXT NOT NULL,
  alert_type      TEXT NOT NULL CHECK (alert_type IN ('price_drop', 'price_spike', 'below_threshold', 'above_threshold')),
  threshold_price DECIMAL(10, 2),
  region          TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  last_triggered  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.community_price_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  commodity_key   TEXT NOT NULL,
  market_name     TEXT,
  region          TEXT,
  price           DECIMAL(10, 2) NOT NULL,
  unit            TEXT DEFAULT 'kg',
  photo_url       TEXT,
  verified_count  INT DEFAULT 0,
  flagged_count   INT DEFAULT 0,
  is_verified     BOOLEAN DEFAULT FALSE,
  reported_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.government_announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  body            TEXT,
  source          TEXT NOT NULL,
  source_url      TEXT NOT NULL,
  announcement_date DATE,
  category        TEXT,
  affected_commodities TEXT[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  data            JSONB DEFAULT '{}',
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================
CREATE INDEX idx_recipes_country       ON public.recipes(country_code, is_public);
CREATE INDEX idx_recipes_cuisine       ON public.recipes(cuisine_id);
CREATE INDEX idx_recipes_slug          ON public.recipes(slug);
CREATE INDEX idx_recipes_meal_type     ON public.recipes USING gin(meal_type);
CREATE INDEX idx_recipes_dietary       ON public.recipes USING gin(dietary_tags);
CREATE INDEX idx_recipes_featured      ON public.recipes(is_featured, created_at DESC);
CREATE INDEX idx_recipes_search        ON public.recipes USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(title_local,'')));
CREATE INDEX idx_pantry_user_expiry    ON public.pantry_items(user_id, expiry_date);
CREATE INDEX idx_grocery_items_list    ON public.grocery_list_items(list_id, is_checked);
CREATE INDEX idx_meal_plan_user_week   ON public.meal_plans(user_id, week_start_date DESC);
CREATE INDEX idx_nutrition_user_date   ON public.nutrition_logs(user_id, log_date DESC);
CREATE INDEX idx_market_prices_key     ON public.market_prices(commodity_key, price_date DESC, country_code);
CREATE INDEX idx_market_prices_latest  ON public.market_prices(is_latest, country_code, category);
CREATE INDEX idx_announcements_active  ON public.government_announcements(is_active, announcement_date DESC);
CREATE INDEX idx_notifications_user    ON public.notifications(user_id, is_read, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuisines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_price_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_announcements ENABLE ROW LEVEL SECURITY;

-- Public read tables
CREATE POLICY "countries_public_read" ON public.countries FOR SELECT USING (true);
CREATE POLICY "cuisines_public_read" ON public.cuisines FOR SELECT USING (true);
CREATE POLICY "recipes_public_read" ON public.recipes FOR SELECT USING (is_public = true);
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "market_prices_public" ON public.market_prices FOR SELECT USING (true);
CREATE POLICY "announcements_public" ON public.government_announcements FOR SELECT USING (is_active = true);

-- Profiles self update
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Private tables: owner only
CREATE POLICY "pantry_owner" ON public.pantry_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "saved_recipes_owner" ON public.saved_recipes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "meal_plans_owner" ON public.meal_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "grocery_lists_owner" ON public.grocery_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "nutrition_owner" ON public.nutrition_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notifications_owner" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_owner" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_owner" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "price_alerts_owner" ON public.price_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "community_price_owner" ON public.community_price_reports FOR ALL USING (auth.uid() = reporter_id);

