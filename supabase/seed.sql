-- 1. Create mock users in auth.users (Supabase Auth table)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES 
  (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'alice@example.com',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'bob@example.com',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Insert into public.profiles (now satisfies profiles_id_fkey)
INSERT INTO public.profiles (id, display_name, role)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'Alice User', 'user'),
  ('b0000000-0000-0000-0000-000000000002', 'Bob Admin', 'admin')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert mock properties
INSERT INTO public.properties (
  id, owner_id, property_id, address, city, state, zip_code, 
  price, bedrooms, bathrooms, square_feet, amenities, status
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'PROP-101',
  '123 Maple Street',
  'Austin',
  'TX',
  '78701',
  450000.00,
  3,
  2.0,
  1850,
  ARRAY['garage', 'central_ac', 'backyard'],
  'active'
), (
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'PROP-102',
  '456 Oak Avenue',
  'Austin',
  'TX',
  '78702',
  320000.00,
  2,
  1.5,
  1100,
  ARRAY['patio'],
  'draft'
);

-- 4. Insert mock sponsors
INSERT INTO public.sponsors (id, business_name, category, website_url, is_active)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'Premier Mortgage Group',
  'mortgage',
  'https://mortgage.example.com',
  TRUE
);

-- 5. Insert mock property-sponsor link
INSERT INTO public.property_sponsors (property_id, sponsor_id)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001'
);

-- 6. Insert mock inquiry
INSERT INTO public.inquiries (property_id, profile_id, message, status)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Hi, is this property still available for viewing?',
  'new'
);