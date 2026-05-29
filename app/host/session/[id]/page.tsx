"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  UserMinus,
  Send,
  Vote,
  CheckCircle2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PinDisplay from "@/components/ui/PinDisplay";
import Timer from "@/components/ui/Timer";
import { createClient } from "@/lib/supabase/client";
import {
  TOPIC_MIN_LENGTH,
  TOPIC_MAX_LENGTH,
  MAX_TEAM_SIZE,
} from "@/lib/constants";
import type { Session, Participant, SessionStatus, Argument } from "@/lib/types";

export default function HostSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [arguments_, setArguments] = useState<Argument[]>([]);
  const [votes, setVotes] = useState<number>(0);
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const hasAutoTransitioned = useRef(false);
  const hasAutoFinished = useRef(false);

  // Cargar sesión
  const loadSession = useCallback(async () => {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (data) setSession(data as Session);
  }, [sessionId, supabase]);

  // Cargar participantes
  const loadParticipants = useCallback(async () => {
    const { data } = await supabase
      .from("participants")
      .select("*")
      .eq("session_id", sessionId)
      .order("joined_at", { ascending: true });

    if (data) setParticipants(data as Participant[]);
  }, [sessionId, supabase]);

  // Cargar argumentos
  const loadArguments = useCallback(async () => {
    const { data } = await supabase
      .from("arguments")
      .select("*")
      .eq("session_id", sessionId);

    if (data) setArguments(data as Argument[]);
  }, [sessionId, supabase]);

  // Contar votos
  const loadVoteCount = useCallback(async () => {
    const { count } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);

    if (count !== null) setVotes(count);
  }, [sessionId, supabase]);

  // Verificar que es el host legítimo
  useEffect(() => {
    const hostId = localStorage.getItem(`host_${sessionId}`);
    if (!hostId) {
      router.push("/");
      return;
    }
  }, [sessionId, router]);

  // Carga inicial + suscripción realtime
  useEffect(() => {
    loadSession();
    loadParticipants();
    loadArguments();
    loadVoteCount();

    const channel = supabase
      .channel(`host-session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${sessionId}`,
        },
        () => loadParticipants()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload: { new: Record<string, unknown> | null }) => {
          if (payload.new) setSession(payload.new as unknown as Session);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "arguments",
          filter: `session_id=eq.${sessionId}`,
        },
        () => loadArguments()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `session_id=eq.${sessionId}`,
        },
        () => loadVoteCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase, loadSession, loadParticipants, loadArguments, loadVoteCount]);

  // AUTO-TRANSICIÓN: cuando ambos equipos enviaron argumentos, pasar a votación
  useEffect(() => {
    if (session?.status !== "in_progress") {
      hasAutoTransitioned.current = false;
      return;
    }
    if (hasAutoTransitioned.current) return;

    const hasTeamA = arguments_.some((a) => a.team === "team_a");
    const hasTeamB = arguments_.some((a) => a.team === "team_b");

    if (hasTeamA && hasTeamB) {
      hasAutoTransitioned.current = true;
      setTimeout(() => startVoting(), 1500);
    }
  }, [arguments_, session?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // AUTO-FINISH: cuando todos los jurados votaron, pasar a resultados
  useEffect(() => {
    if (session?.status !== "voting") {
      hasAutoFinished.current = false;
      return;
    }
    if (hasAutoFinished.current) return;

    const juryCount = participants.filter((p) => p.role === "jury").length;
    if (juryCount === 0) return;

    if (votes >= juryCount) {
      hasAutoFinished.current = true;
      setTimeout(() => finishSession(), 1500);
    }
  }, [votes, participants, session?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Actualizar estado de sesión
  const updateStatus = async (status: SessionStatus) => {
    if (actionLoading) return;
    setActionLoading(true);
    await supabase
      .from("sessions")
      .update({ status })
      .eq("id", sessionId);
    await loadSession();
    setActionLoading(false);
  };

  // Asignar rol a participante
  const assignRole = async (participantId: string, role: "team_a" | "team_b" | "jury") => {
    if (role === "team_a" || role === "team_b") {
      const teamCount = participants.filter((p) => p.role === role).length;
      if (teamCount >= MAX_TEAM_SIZE) {
        setError(`Máximo ${MAX_TEAM_SIZE} personas por equipo`);
        setTimeout(() => setError(""), 3000);
        return;
      }
    }
    await supabase
      .from("participants")
      .update({ role })
      .eq("id", participantId);
    loadParticipants();
    setError("");
  };

  // Expulsar participante
  const kickParticipant = async (participantId: string) => {
    await supabase.from("participants").delete().eq("id", participantId);
    loadParticipants();
  };

  // Cargar tema
  const submitTopic = async () => {
    if (topic.length < TOPIC_MIN_LENGTH || topic.length > TOPIC_MAX_LENGTH) {
      setError(
        `El tema debe tener entre ${TOPIC_MIN_LENGTH} y ${TOPIC_MAX_LENGTH} caracteres`
      );
      return;
    }
    await supabase
      .from("sessions")
      .update({ topic })
      .eq("id", sessionId);
    await loadSession();
    setError("");
  };

  // Iniciar debate
  const startDebate = async () => {
    if (actionLoading) return;

    const teamA = participants.filter((p) => p.role === "team_a");
    const teamB = participants.filter((p) => p.role === "team_b");

    if (teamA.length === 0 || teamB.length === 0) {
      setError("Necesitas al menos 1 persona en cada equipo");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!session?.topic) {
      setError("Debes cargar un tema antes de iniciar");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setError("");
    hasAutoTransitioned.current = false;
    await updateStatus("in_progress");
    setTimerRunning(true);
  };

  // Iniciar votación
  const startVoting = useCallback(async () => {
    setTimerRunning(false);
    await supabase
      .from("sessions")
      .update({ status: "voting" })
      .eq("id", sessionId);
    await loadSession();
    setTimeout(() => setTimerRunning(true), 500);
  }, [sessionId, supabase, loadSession]);

  // Finalizar sesión
  const finishSession = useCallback(async () => {
    setTimerRunning(false);
    await supabase
      .from("sessions")
      .update({ status: "finished" })
      .eq("id", sessionId);
    await loadSession();
  }, [sessionId, supabase, loadSession]);

  // Cancelar sesión
  const cancelSession = async () => {
    if (actionLoading) return;
    await updateStatus("cancelled");
    router.push("/");
  };

  // Reiniciar (mismo grupo, nuevo tema)
  const resetSession = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setTopic("");
    setTimerRunning(false);
    hasAutoTransitioned.current = false;
    hasAutoFinished.current = false;
    await supabase
      .from("sessions")
      .update({ status: "waiting", topic: null })
      .eq("id", sessionId);
    await supabase.from("arguments").delete().eq("session_id", sessionId);
    await supabase.from("votes").delete().eq("session_id", sessionId);
    setArguments([]);
    setVotes(0);
    await loadSession();
    setActionLoading(false);
  };

  if (!session) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-text-muted">Cargando sesión...</p>
      </main>
    );
  }

  const teamA = participants.filter((p) => p.role === "team_a");
  const teamB = participants.filter((p) => p.role === "team_b");
  const jury = participants.filter((p) => p.role === "jury");
  const teamASubmitted = arguments_.some((a) => a.team === "team_a");
  const teamBSubmitted = arguments_.some((a) => a.team === "team_b");

  return (
    <main className="flex-1 flex flex-col px-4 py-6 gap-4 max-w-lg mx-auto w-full">
      {/* Header con estado */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Panel de Control</h1>
        <span className="text-xs px-2 py-1 rounded-full bg-surface-light text-text-muted uppercase">
          {session.status === "waiting" && "Esperando"}
          {session.status === "in_progress" && "En debate"}
          {session.status === "voting" && "Votación"}
          {session.status === "finished" && "Finalizado"}
          {session.status === "cancelled" && "Cancelado"}
        </span>
      </div>

      <PinDisplay pin={session.pin} />

      {/* Timer */}
      <AnimatePresence>
        {(session.status === "in_progress" || session.status === "voting") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Timer
              totalSeconds={
                session.status === "in_progress"
                  ? session.argument_time
                  : session.voting_time
              }
              isRunning={timerRunning}
              onTimeUp={() => {
                if (session.status === "in_progress") {
                  startVoting();
                } else {
                  finishSession();
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de argumentos recibidos (durante debate) */}
      {session.status === "in_progress" && (
        <Card className="flex flex-col gap-2">
          <p className="text-xs text-text-muted font-bold uppercase">Argumentos recibidos</p>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${teamASubmitted ? "text-success" : "text-text-muted"}`}>
              {teamASubmitted ? "✓" : "⏳"} Equipo A
            </span>
            <span className={`text-sm ${teamBSubmitted ? "text-success" : "text-text-muted"}`}>
              {teamBSubmitted ? "✓" : "⏳"} Equipo B
            </span>
          </div>
          {teamASubmitted && teamBSubmitted && (
            <p className="text-xs text-success animate-pulse">
              Ambos equipos enviaron — pasando a votación...
            </p>
          )}
        </Card>
      )}

      {/* Tema */}
      {session.status === "waiting" && !session.topic && (
        <Card className="flex flex-col gap-3">
          <Input
            label="Tema a debatir"
            placeholder="Escribe el tema o pregunta jurídica..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={TOPIC_MAX_LENGTH}
          />
          <div className="flex justify-between text-xs text-text-muted">
            <span>{topic.length}/{TOPIC_MAX_LENGTH}</span>
            <span>Mín. {TOPIC_MIN_LENGTH}</span>
          </div>
          <Button size="sm" onClick={submitTopic} disabled={topic.length < TOPIC_MIN_LENGTH}>
            <Send className="w-4 h-4 mr-1" />
            Cargar Tema
          </Button>
        </Card>
      )}

      {session.topic && (
        <Card className="border-primary/30">
          <p className="text-sm text-text-muted mb-1">Tema:</p>
          <p className="text-foreground font-medium">{session.topic}</p>
          {session.status === "waiting" && (
            <button
              onClick={async () => {
                await supabase
                  .from("sessions")
                  .update({ topic: null })
                  .eq("id", sessionId);
                setTopic("");
                loadSession();
              }}
              className="text-xs text-danger mt-2 hover:underline"
            >
              Cambiar tema
            </button>
          )}
        </Card>
      )}

      {/* Participantes */}
      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-secondary">
          Participantes ({participants.length})
        </h2>

        <div>
          <p className="text-xs text-primary mb-1">
            Equipo A — Defensa ({teamA.length}/{MAX_TEAM_SIZE})
          </p>
          {teamA.map((p) => (
            <ParticipantRow
              key={p.id}
              participant={p}
              onKick={() => kickParticipant(p.id)}
              onRoleChange={(role) => assignRole(p.id, role)}
              sessionStatus={session.status}
            />
          ))}
        </div>

        <div>
          <p className="text-xs text-danger mb-1">
            Equipo B — Refutación ({teamB.length}/{MAX_TEAM_SIZE})
          </p>
          {teamB.map((p) => (
            <ParticipantRow
              key={p.id}
              participant={p}
              onKick={() => kickParticipant(p.id)}
              onRoleChange={(role) => assignRole(p.id, role)}
              sessionStatus={session.status}
            />
          ))}
        </div>

        <div>
          <p className="text-xs text-secondary mb-1">Jurado ({jury.length})</p>
          {jury.map((p) => (
            <ParticipantRow
              key={p.id}
              participant={p}
              onKick={() => kickParticipant(p.id)}
              onRoleChange={(role) => assignRole(p.id, role)}
              sessionStatus={session.status}
            />
          ))}
        </div>

        {participants.length === 0 && (
          <p className="text-xs text-text-muted text-center py-2">
            Esperando participantes...
          </p>
        )}
      </Card>

      {error && <p className="text-sm text-danger text-center">{error}</p>}

      {/* Controles */}
      <div className="flex flex-col gap-2">
        {session.status === "waiting" && (
          <Button
            size="lg"
            glow
            className="w-full"
            onClick={startDebate}
            disabled={actionLoading}
          >
            <Play className="w-5 h-5 mr-2" />
            Iniciar Debate
          </Button>
        )}

        {session.status === "in_progress" && (
          <>
            <Button
              size="md"
              variant="secondary"
              className="w-full"
              onClick={() => setTimerRunning(!timerRunning)}
            >
              {timerRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" /> Reanudar
                </>
              )}
            </Button>
            {/* Botón manual para forzar paso a votación */}
            <Button
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={startVoting}
            >
              <Vote className="w-4 h-4 mr-1" />
              Forzar paso a votación
            </Button>
          </>
        )}

        {session.status === "voting" && (
          <Button size="md" variant="secondary" className="w-full" disabled>
            <Vote className="w-4 h-4 mr-2" />
            Votación: {votes}/{jury.length} votos
          </Button>
        )}

        {session.status === "finished" && (
          <Button
            size="md"
            className="w-full"
            onClick={() => router.push(`/results/${sessionId}`)}
          >
            Ver Resultados
          </Button>
        )}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={resetSession}
            disabled={actionLoading}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reiniciar
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            onClick={cancelSession}
            disabled={actionLoading}
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
        </div>
      </div>
    </main>
  );
}

function ParticipantRow({
  participant,
  onKick,
  onRoleChange,
  sessionStatus,
}: {
  participant: Participant;
  onKick: () => void;
  onRoleChange: (role: "team_a" | "team_b" | "jury") => void;
  sessionStatus: SessionStatus;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-light/50">
      <span className="text-sm text-foreground">{participant.name}</span>
      {sessionStatus === "waiting" && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onRoleChange("team_a")}
            className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20"
            title="Mover a Equipo A"
          >
            A
          </button>
          <button
            onClick={() => onRoleChange("team_b")}
            className="text-xs px-2 py-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20"
            title="Mover a Equipo B"
          >
            B
          </button>
          <button
            onClick={() => onRoleChange("jury")}
            className="text-xs px-2 py-0.5 rounded bg-secondary/10 text-secondary hover:bg-secondary/20"
            title="Mover a Jurado"
          >
            J
          </button>
          <button
            onClick={onKick}
            className="text-xs p-1 rounded text-danger/60 hover:text-danger hover:bg-danger/10"
            title="Expulsar"
          >
            <UserMinus className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
