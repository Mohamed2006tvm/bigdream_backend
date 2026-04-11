-- Seed screens A, B, C
INSERT INTO screens (name) VALUES ('A'), ('B'), ('C')
  ON CONFLICT (name) DO NOTHING;

-- ─── default settings ──────────────────────────────────────────────────────────
INSERT INTO global_settings (key, value) 
VALUES ('time_slots', '["09:00-12:00", "12:00-15:00", "15:00-18:00", "18:00-21:00", "21:00-00:00"]')
ON CONFLICT (key) DO NOTHING;

INSERT INTO global_settings (key, value)
VALUES ('availability_config', '{"mode": "dynamic", "days": 7, "dates": []}'::jsonb)
ON CONFLICT (key) DO NOTHING;
