-- ============================================
-- Migración: cronómetro con fecha límite en la BD
-- Ejecutar UNA VEZ en Supabase SQL Editor antes de desplegar.
-- ============================================

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS phase_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paused_seconds_left INTEGER;

-- Sin esta política, "Reiniciar" no borra los votos: RLS descarta el DELETE
-- en silencio y los votos de la ronda anterior cuentan en la siguiente.
DROP POLICY IF EXISTS "Votos pueden ser eliminados (reset)" ON votes;
CREATE POLICY "Votos pueden ser eliminados (reset)"
  ON votes FOR DELETE
  USING (true);
