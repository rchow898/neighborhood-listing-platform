-- Step 7: Create targeted Row-Level Security policies

-- ============================================================================
-- 1. PROPERTIES POLICIES
-- ============================================================================

GRANT SELECT ON public.properties TO anon, authenticated;
GRANT INSERT, UPDATE ON public.properties TO authenticated;

-- Public can read approved listings
CREATE POLICY "Public can view approved properties"
  ON public.properties
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Authenticated owners can view all of their own records
CREATE POLICY "Owners can view their own properties"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- Authenticated owners can insert properties for themselves as draft/pending
CREATE POLICY "Owners can insert their own draft properties"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND status != 'approved'
  );

-- Authenticated owners can edit ONLY their own unapproved records
CREATE POLICY "Owners can update their own unapproved properties"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) 
    AND status != 'approved'
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid()) 
    AND status != 'approved'
  );

-- ============================================================================
-- 2. SPONSORS & JUNCTION POLICIES
-- ============================================================================

GRANT SELECT ON public.sponsors TO anon, authenticated;
GRANT SELECT ON public.property_sponsors TO anon, authenticated;

-- Public can read active sponsors
CREATE POLICY "Public can view active sponsors"
  ON public.sponsors
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Public can view property-sponsor relations for approved properties and active sponsors
CREATE POLICY "Public can view property sponsors for approved listings"
  ON public.property_sponsors
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_sponsors.property_id
        AND p.status = 'approved'
    )
  );

-- ============================================================================
-- 3. PROFILES POLICIES
-- ============================================================================

GRANT SELECT, UPDATE ON public.profiles TO authenticated;

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- ============================================================================
-- 4. INQUIRIES POLICIES
-- ============================================================================

GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT SELECT ON public.inquiries TO authenticated;

CREATE POLICY "Anyone can submit inquiries"
  ON public.inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can view inquiries for their properties"
  ON public.inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = inquiries.property_id
        AND p.owner_id = (SELECT auth.uid())
    )
  );