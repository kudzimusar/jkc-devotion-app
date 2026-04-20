
-- Migration: Language School Enhancement for JKC Pilot
-- Adds the missing ministry and form template for Kingdom Language School

-- 1. Insert Language School Ministry
INSERT INTO public.ministries (org_id, name, slug, description, category, color, icon)
VALUES (
  'fa547adf-f820-412f-9458-d6bade11517d', 
  'Kingdom Language School', 
  'language-school', 
  'Bridging cultures through language mastery and Kingdom values.', 
  'outreach', 
  '#D4AF37', -- JKC GOLD
  'languages'
)
ON CONFLICT (org_id, slug) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- 2. Add Language School Enrollment Form Template
INSERT INTO public.form_templates (org_id, name, report_type, description, fields)
VALUES (
  'fa547adf-f820-412f-9458-d6bade11517d',
  'Language School Application',
  'enrollment',
  'Official student enrollment for the Kingdom Language School',
  '[
    {"name":"track",       "label":"Learning Track",   "type":"select", "required":true, "options":["Japanese","English"]},
    {"name":"level",       "label":"Current Level",     "type":"select", "required":true, "options":["Absolute Beginner","Basic Survival","Elementary","Intermediate"]},
    {"name":"enroll_half", "label":"Desired Semester",  "type":"select", "required":true, "options":["Semester 1 (Mar-Jul)","Semester 2 (Aug-Dec)"]},
    {"name":"phone",       "label":"Phone Number",     "type":"tel",    "required":true},
    {"name":"notes",       "label":"Motivation/Notes",  "type":"textarea","required":false}
  ]'
)
ON CONFLICT DO NOTHING;

-- 3. Ensure Index for Performance on Inquiries
CREATE INDEX IF NOT EXISTS idx_public_inquiries_visitor_type ON public.public_inquiries(visitor_type);
CREATE INDEX IF NOT EXISTS idx_public_inquiries_org_visitor ON public.public_inquiries(org_id, visitor_type);
