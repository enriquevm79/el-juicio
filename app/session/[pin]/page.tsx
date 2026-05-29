"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import PinDisplay from "@/components/ui/PinDisplay";
import DebateView from "@/components/session/DebateView";
import VotingView from "@/components/session/VotingView";
import ResultsView from "@/components/session/ResultsView";
import { createClient } from "@/lib/supabase/client";
import type { Session, Participant } from "@/lib/types";

export default function SessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const pin = params.pin as string;
  const playerName = searchParams.get("name") || "Anónimo";

  const [session, setSession] = useState<Session | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(true);

  const hasJoined = useRef(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Unirse a la sesión (se ejecuta una sola vez)
  useEffect(() => {
    if (hasJoined.current) return;
    hasJoined.current = true;

    const join = async () => {
      // Buscar sesión por PIN
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("pin", pin)
        .in("status", ["waiting"])
        .single();

      if (sessionError || !sessionData) {
        setError("Sesión no encontrada o ya iniciada. Verifica el PIN.");
        setJoining(false);
        return;
      }

      const sess = sessionData as Session;
      setSession(sess);

      // Verificar si ya estamos en la sesión (reconexión de esta pestaña)
      const storedId = sessionStorage.getItem(`participant_${sess.id}`);
      if (storedId) {
        const { data: existing } = await supabase
          .from("participants")
          .select("*")
          .eq("id", storedId)
          .single();

        if (existing) {
          setParticipant(existing as Participant);
          setJoining(false);
          return;
        }
      }

      // Verificar límite de participantes
      const { count } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("session_id", sess.id);

      if (count !== null && count >= sess.max_participants) {
        setError("La sesión está llena.");
        setJoining(false);
        return;
      }

      // Crear participante
      const { data: newParticipant, error: joinError } = await supabase
        .from("participants")
        .insert({
          session_id: sess.id,
          name: playerName,
          role: "jury",
          is_active: true,
        })
        .select()
        .single();

      if (joinError || !newParticipant) {
        setError("Error al unirse. Intenta de nuevo.");
        setJoining(false);
        return;
      }

      const p = newParticipant as Participant;
      setParticipant(p);
      sessionStorage.setItem(`participant_${sess.id}`, p.id);
      setJoining(false);
    };

    join();
  }, [pin, playerName, supabase]);

  // Suscripción a cambios en tiempo real (solo cuando tenemos sesión)
  useEffect(() => {
    if (!session) return;

    // Carga inicial de participantes
    const loadParticipants = async () => {
      const { data } = await supabase
        .from("participants")
        .select("*")
        .eq("session_id", session.id)
        .order("joined_at", { ascending: true });

      if (data) setParticipants(data as Participant[]);
    };

    loadParticipants();

    const channel = supabase
      .channel(`participant-view-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload: { new: Record<string, unknown> | null }) => {
          if (payload.new) setSession(payload.new as unknown as Session);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${session.id}`,
        },
        () => loadParticipants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Actualizar rol del participante cuando cambia en la lista
  useEffect(() => {
    if (!participant || !participants.length) return;
    const updated = participants.find((p) => p.id === participant.id);
    if (updated && updated.role !== participant.role) {
      setParticipant(updated);
    }
  }, [participants, participant]);

  // Estados de carga y error
  if (joining) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <Card className="text-center">
          <p className="text-danger">{error}</p>
        </Card>
      </main>
    );
  }

  if (!session || !participant) return null;

  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full">
      <AnimatePresence mode="wait">
        {session.status === "waiting" && (
          <LobbyView
            key="lobby"
            session={session}
            participant={participant}
            participants={participants}
          />
        )}
        {session.status === "in_progress" && (
          <DebateView
            key="debate"
            session={session}
            participant={participant}
          />
        )}
        {session.status === "voting" && (
          <VotingView
            key="voting"
            session={session}
            participant={participant}
          />
        )}
        {(session.status === "finished" || session.status === "cancelled") && (
          <ResultsView
            key="results"
            session={session}
            participant={participant}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// Vista del lobby
function LobbyView({
  session,
  participant,
  participants,
}: {
  session: Session;
  participant: Participant;
  participants: Participant[];
}) {
  const roleLabels = {
    team_a: "Equipo A (Defensa)",
    team_b: "Equipo B (Refutación)",
    jury: "Jurado",
  };

  const roleColors = {
    team_a: "text-primary",
    team_b: "text-danger",
    jury: "text-secondary",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-6"
    >
      <PinDisplay pin={session.pin} />

      <Card className="w-full text-center">
        <p className="text-text-muted text-sm">Tu rol:</p>
        <p className={`text-lg font-bold ${roleColors[participant.role]}`}>
          {roleLabels[participant.role]}
        </p>
        <p className="text-xs text-text-muted mt-2">
          Esperando a que el moderador inicie...
        </p>
      </Card>

      {session.topic && (
        <Card className="w-full border-primary/20">
          <p className="text-xs text-text-muted mb-1">Tema del debate:</p>
          <p className="text-foreground">{session.topic}</p>
        </Card>
      )}

      <Card className="w-full">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm text-secondary">
            Conectados ({participants.length})
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <span
              key={p.id}
              className={`text-xs px-2 py-1 rounded-full bg-surface-light ${
                p.id === participant.id ? "border border-primary/50" : ""
              }`}
            >
              {p.name}
            </span>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
