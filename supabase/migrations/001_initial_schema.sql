-- migrations/001_initial_schema.sql (or supabase/migrations/<timestamp>_initial_schema.sql)

-- 0. EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NULL,
  role TEXT NOT NULL DEFAULT 'user'
    CONSTRAINT chk_profiles_role CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 2. PROPERTIES
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  property_id TEXT NOT NULL CONSTRAINT uq_properties_property_id UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL CONSTRAINT chk_properties_state CHECK (state ~ '^[A-Z]{2}$'),
  zip_code TEXT NOT NULL CONSTRAINT chk_properties_zip_code CHECK (zip_code ~ '^[0-9]{5}$'),
  price NUMERIC(12, 2) NOT NULL CONSTRAINT chk_properties_price CHECK (price >= 0),
  bedrooms INTEGER NOT NULL CONSTRAINT chk_properties_bedrooms CHECK (bedrooms >= 0),
  bathrooms NUMERIC(3, 1) NOT NULL CONSTRAINT chk_properties_bathrooms CHECK (bathrooms >= 0),
  square_feet INTEGER NOT NULL CONSTRAINT chk_properties_square_feet CHECK (square_feet >= 0),
  amenities TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CONSTRAINT chk_properties_status CHECK (
      status IN ('draft', 'pending_approval', 'active', 'inactive', 'archived')
    ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_properties_set_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 3. SPONSORS
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  category TEXT NOT NULL CONSTRAINT chk_sponsors_category CHECK (
    category IN (
      'mortgage', 'insurance', 'home_inspection',
      'moving_storage', 'legal', 'contractor', 'local_business'
    )
  ),
  website_url TEXT NULL CONSTRAINT chk_sponsors_website_url CHECK (
    website_url IS NULL OR website_url ~* '^https?://[^\s/$.?#].[^\s]*$'
  ),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_sponsors_set_updated_at
BEFORE UPDATE ON public.sponsors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4. PROPERTY_SPONSORS (Association Table)
CREATE TABLE public.property_sponsors (
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (property_id, sponsor_id)
);

-- 5. INQUIRIES
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL CONSTRAINT chk_inquiries_message_nonempty CHECK (length(trim(message)) > 0),
  status TEXT NOT NULL DEFAULT 'new' CONSTRAINT chk_inquiries_status CHECK (
    status IN ('new', 'read', 'responded', 'closed')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_inquiries_set_updated_at
BEFORE UPDATE ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 6. INDEXES
CREATE INDEX idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX idx_inquiries_property_id ON public.inquiries(property_id);
CREATE INDEX idx_inquiries_profile_id ON public.inquiries(profile_id);
CREATE INDEX idx_property_sponsors_sponsor_id ON public.property_sponsors(sponsor_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_city_state ON public.properties(city, state);
CREATE INDEX idx_sponsors_category_active ON public.sponsors(category) WHERE is_active = TRUE;

-- 7. ROW-LEVEL SECURITY ENABLING
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;