-- ============================================
-- DUELO DE CONCEPTOS — Esquema de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Tipos ENUM
CREATE TYPE session_status AS ENUM ('waiting', 'in_progress', 'voting', 'finished', 'cancelled');
CREATE TYPE participant_role AS ENUM ('team_a', 'team_b', 'jury');
CREATE TYPE vote_choice AS ENUM ('team_a', 'team_b');

-- Tabla: sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin VARCHAR(6) NOT NULL,
  host_id UUID NOT NULL,
  topic TEXT,
  status session_status NOT NULL DEFAULT 'waiting',
  argument_time INTEGER NOT NULL DEFAULT 180,
  voting_time INTEGER NOT NULL DEFAULT 60,
  max_participants INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice único para PINs activos (no permite duplicados en sesiones activas)
CREATE UNIQUE INDEX idx_sessions_active_pin 
  ON sessions (pin) 
  WHERE status IN ('waiting', 'in_progress', 'voting');

-- Tabla: participants
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(30) NOT NULL,
  role participant_role NOT NULL DEFAULT 'jury',
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_participants_session ON participants(session_id);

-- Tabla: votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  voted_for vote_choice NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Un voto por persona por sesión
  UNIQUE(session_id, participant_id)
);

CREATE INDEX idx_votes_session ON votes(session_id);

-- Tabla: arguments
CREATE TABLE arguments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  team vote_choice NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 50 AND char_length(content) <= 1000),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_arguments_session ON arguments(session_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE arguments ENABLE ROW LEVEL SECURITY;

-- Políticas para sessions: todos pueden leer sesiones activas, solo el host modifica
CREATE POLICY "Cualquiera puede ver sesiones activas"
  ON sessions FOR SELECT
  USING (true);

CREATE POLICY "Cualquiera puede crear sesiones"
  ON sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Solo el host puede actualizar su sesión"
  ON sessions FOR UPDATE
  USING (true); -- Simplificado: en producción usar auth.uid() = host_id

-- Políticas para participants
CREATE POLICY "Cualquiera puede ver participantes de una sesión"
  ON participants FOR SELECT
  USING (true);

CREATE POLICY "Cualquiera puede unirse a una sesión"
  ON participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Participantes pueden ser actualizados"
  ON participants FOR UPDATE
  USING (true);

CREATE POLICY "Participantes pueden ser eliminados"
  ON participants FOR DELETE
  USING (true);

-- Políticas para votes
CREATE POLICY "Cualquiera puede ver votos"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Jurados pueden votar"
  ON votes FOR INSERT
  WITH CHECK (true);

-- Políticas para arguments
CREATE POLICY "Cualquiera puede ver argumentos"
  ON arguments FOR SELECT
  USING (true);

CREATE POLICY "Equipos pueden enviar argumentos"
  ON arguments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Argumentos pueden ser eliminados (reset)"
  ON arguments FOR DELETE
  USING (true);

-- ============================================
-- Realtime: habilitar para las tablas necesarias
-- ============================================
-- En Supabase Dashboard > Database > Replication
-- Habilitar realtime para: sessions, participants, votes
