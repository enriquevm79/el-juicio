import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "./types";

// Las transiciones se escriben con un guard `.eq("status", ...)`: cualquier
// dispositivo conectado puede dispararlas al agotarse el tiempo y solo la
// primera escritura tiene efecto.

export function deadlineIn(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function secondsLeftUntil(endsAt: string | null): number {
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000));
}

export async function startDebatePhase(
  supabase: SupabaseClient,
  session: Session
) {
  return supabase
    .from("sessions")
    .update({
      status: "in_progress",
      phase_ends_at: deadlineIn(session.argument_time),
      paused_seconds_left: null,
    })
    .eq("id", session.id)
    .eq("status", "waiting");
}

export async function startVotingPhase(
  supabase: SupabaseClient,
  session: Session
) {
  return supabase
    .from("sessions")
    .update({
      status: "voting",
      phase_ends_at: deadlineIn(session.voting_time),
      paused_seconds_left: null,
    })
    .eq("id", session.id)
    .eq("status", "in_progress");
}

export async function finishSessionPhase(
  supabase: SupabaseClient,
  sessionId: string
) {
  return supabase
    .from("sessions")
    .update({
      status: "finished",
      phase_ends_at: null,
      paused_seconds_left: null,
    })
    .eq("id", sessionId)
    .eq("status", "voting");
}

export async function pausePhase(supabase: SupabaseClient, session: Session) {
  return supabase
    .from("sessions")
    .update({
      phase_ends_at: null,
      paused_seconds_left: secondsLeftUntil(session.phase_ends_at),
    })
    .eq("id", session.id);
}

export async function resumePhase(supabase: SupabaseClient, session: Session) {
  return supabase
    .from("sessions")
    .update({
      phase_ends_at: deadlineIn(session.paused_seconds_left ?? 0),
      paused_seconds_left: null,
    })
    .eq("id", session.id);
}
