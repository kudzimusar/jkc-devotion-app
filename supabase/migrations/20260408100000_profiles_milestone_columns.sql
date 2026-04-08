-- Add 5 milestone date columns to profiles table (all idempotent via IF NOT EXISTS)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_visit_date DATE,
  ADD COLUMN IF NOT EXISTS leadership_training_date DATE,
  ADD COLUMN IF NOT EXISTS ordained_date DATE,
  ADD COLUMN IF NOT EXISTS membership_date DATE,
  ADD COLUMN IF NOT EXISTS foundation_class_date DATE;
