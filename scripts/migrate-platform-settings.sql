-- ============================================================
-- StakeKE — Platform Settings seed / migration script
-- Run this on your Neon DB whenever new settings keys are added.
-- Safe to run multiple times (INSERT ... ON CONFLICT DO NOTHING).
-- ============================================================

INSERT INTO platform_settings (key, value, updated_by)
VALUES
  -- PayHero credentials (leave blank if not set yet)
  ('payhero_username',    '',        'migration'),
  ('payhero_password',    '',        'migration'),
  ('payhero_channel_id',  '',        'migration'),

  -- Referral commission percentages
  ('tier1_referral_percent', '5',    'migration'),
  ('tier2_referral_percent', '2',    'migration'),

  -- Deposit limits (KES)
  ('min_deposit',  '10',             'migration'),
  ('max_deposit',  '150000',         'migration'),

  -- Withdrawal limits (KES)
  ('min_withdrawal', '100',          'migration'),
  ('max_withdrawal', '150000',       'migration'),

  -- Communication settings
  ('whatsapp_number',           '',  'migration'),
  ('cloudinary_cloud_name',     '',  'migration'),
  ('cloudinary_upload_preset',  '',  'migration')

ON CONFLICT (key) DO NOTHING;

-- Verify what was inserted / already existed:
SELECT key, value, updated_at FROM platform_settings ORDER BY key;
