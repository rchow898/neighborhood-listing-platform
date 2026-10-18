-- Step 6: Enable Row-Level Security on every exposed table (Default Deny)

-- 1. Enable RLS on all five tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 2. Explicitly revoke default public access so no policies grant access yet
REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.properties FROM anon, authenticated;
REVOKE ALL ON public.sponsors FROM anon, authenticated;
REVOKE ALL ON public.property_sponsors FROM anon, authenticated;
REVOKE ALL ON public.inquiries FROM anon, authenticated;