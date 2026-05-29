// === Tipos principales de Duelo de Conceptos ===

export type SessionStatus =
  | "waiting"
  | "in_progress"
  | "voting"
  | "finished"
  | "cancelled";

export type ParticipantRole = "team_a" | "team_b" | "jury";

export type VoteChoice = "team_a" | "team_b";

// Sesión de debate
export interface Session {
  id: string;
  pin: string;
  host_id: string;
  topic: string | null;
  status: SessionStatus;
  argument_time: number; // segundos
  voting_time: number; // segundos
  max_participants: number;
  created_at: string;
}

// Participante en una sesión
export interface Participant {
  id: string;
  session_id: string;
  name: string;
  role: ParticipantRole;
  is_active: boolean;
  joined_at: string;
}

// Voto del jurado
export interface Vote {
  id: string;
  session_id: string;
  participant_id: string;
  voted_for: VoteChoice;
  created_at: string;
}

// Argumento de un equipo
export interface Argument {
  id: string;
  session_id: string;
  team: VoteChoice;
  content: string;
  submitted_at: string;
}

// Para crear sesión
export interface CreateSessionPayload {
  host_id: string;
  argument_time?: number;
  voting_time?: number;
}

// Para unirse a sesión
export interface JoinSessionPayload {
  pin: string;
  name: string;
}
