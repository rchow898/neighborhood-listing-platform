-- 1. Default-Deny Activation
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 2. Public / Anonymous Read Policies
CREATE POLICY "Public users can view approved properties"
  ON public.properties
  FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Public users can view active sponsors"
  ON public.sponsors
  FOR SELECT
  USING (active_status = true);

CREATE POLICY "Public users can view sponsors linked to approved properties"
  ON public.property_sponsors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE public.properties.id = public.property_sponsors.property_id
        AND public.properties.status = 'approved'
    )
  );

-- 3. Property Owner Scoped Access
CREATE POLICY "Owners can view own properties"
  ON public.properties
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert own properties"
  ON public.properties
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own draft or rejected properties"
  ON public.properties
  FOR UPDATE
  USING (
    auth.uid() = owner_id 
    AND status IN ('draft', 'rejected')
  )
  WITH CHECK (
    auth.uid() = owner_id 
    AND status IN ('draft', 'rejected')
  );

CREATE POLICY "Owners can delete own properties"
  ON public.properties
  FOR DELETE
  USING (auth.uid() = owner_id);

-- 4. Inquiries Access Policies
CREATE POLICY "Anyone can insert an inquiry"
  ON public.inquiries
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners and admins can view inquiries for their properties"
  ON public.inquiries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE public.properties.id = public.inquiries.property_id
        AND public.properties.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    )
  );