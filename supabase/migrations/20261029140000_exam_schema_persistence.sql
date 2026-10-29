-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'property_owner', 'sponsor', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Sponsors Table
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2),
  tier TEXT NOT NULL CHECK (tier IN ('gold', 'silver', 'bronze')),
  active_status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  address TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
  bathrooms NUMERIC(3, 1) NOT NULL CHECK (bathrooms >= 0),
  square_feet INTEGER NOT NULL CHECK (square_feet > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Property Sponsors Junction Table
CREATE TABLE IF NOT EXISTS public.property_sponsors (
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, sponsor_id)
);

-- 5. Inquiries Table
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  inquirer_email TEXT NOT NULL CHECK (inquirer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  message TEXT NOT NULL CHECK (char_length(message) >= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);