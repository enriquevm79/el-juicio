"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Timer from "@/components/ui/Timer";
import { createClient } from "@/lib/supabase/client";
import type { Session, Participant, Argument, VoteChoice } from "@/lib/types";

interface VotingViewProps {
  session: Session;
  participant: Participant;
}

export default function VotingView({ session, participant }: VotingViewProps) {
  const [arguments_, setArguments] = useState<Argument[]>([]);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [votedFor, setVotedFor] = useState<VoteChoice | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const hasLoaded = useRef(false);

  const isJury = participant.role === "jury";

  // Cargar argumentos y verificar voto previo (una sola vez)
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const load = async () => {
      // Cargar argumentos
      const { data: argsData } = await supabase
        .from("arguments")
        .select("*")
        .eq("session_id", session.id);

      if (argsData) setArguments(argsData as Argument[]);

      // Verificar si ya votó (solo jurado)
      if (isJury) {
        const { data: voteData } = await supabase
          .from("votes")
          .select("voted_for")
          .eq("session_id", session.id)
          .eq("participant_id", participant.id)
          .single();

        if (voteData) {
          setVoted(true);
          setVotedFor((voteData as { voted_for: VoteChoice }).voted_for);
        }
      }
    };

    load();
  }, [session.id, participant.id, isJury, supabase]);

  const handleVote = async (choice: VoteChoice) => {
    // Prevenir doble voto
    if (voted || voting) return;
    setVoting(true);

    const { error } = await supabase.from("votes").insert({
      session_id: session.id,
      participant_id: participant.id,
      voted_for: choice,
    });

    if (error) {
      // Si el error es por constraint unique, ya votó
      if (error.code === "23505") {
        setVoted(true);
      }
      setVoting(false);
      return;
    }

    setVoted(true);
    setVotedFor(choice);
    setVoting(false);
  };

  const teamAArgument = arguments_.find((a) => a.team === "team_a");
  const teamBArgument = arguments_.find((a) => a.team === "team_b");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-4"
    >
      {/* Tema */}
      <Card className="border-primary/20 text-center">
        <p className="text-xs text-text-muted mb-1">TEMA EN DEBATE</p>
        <p className="text-foreground font-medium">{session.topic}</p>
      </Card>

      {/* Timer de votación (solo jurado) */}
      {isJury && !voted && (
        <Timer
          totalSeconds={session.voting_time}
          isRunning={true}
          onTimeUp={() => {}}
        />
      )}

      {/* Argumentos */}
      <div className="flex flex-col gap-3">
        <Card
          className={`border-l-4 border-l-primary ${
            votedFor === "team_a" ? "ring-2 ring-primary" : ""
          }`}
        >
          <p className="text-xs text-primary font-bold mb-2">
            EQUIPO A — DEFENSA
          </p>
          <p className="text-sm text-foreground">
            {teamAArgument?.content || "No se presentó argumento"}
          </p>
        </Card>

        <Card
          className={`border-l-4 border-l-danger ${
            votedFor === "team_b" ? "ring-2 ring-danger" : ""
          }`}
        >
          <p className="text-xs text-danger font-bold mb-2">
            EQUIPO B — REFUTACIÓN
          </p>
          <p className="text-sm text-foreground">
            {teamBArgument?.content || "No se presentó argumento"}
          </p>
        </Card>
      </div>

      {/* Botones de voto (solo jurado, solo si no ha votado) */}
      {isJury && !voted && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1 border-primary/30 hover:border-primary"
            onClick={() => handleVote("team_a")}
            disabled={voting}
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Equipo A
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1 border-danger/30 hover:border-danger"
            onClick={() => handleVote("team_b")}
            disabled={voting}
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Equipo B
          </Button>
        </div>
      )}

      {/* Confirmación de voto */}
      {voted && (
        <Card className="text-center border-success/30">
          <p className="text-success font-medium">✓ Tu voto fue registrado</p>
          <p className="text-xs text-text-muted mt-1">
            Esperando resultados...
          </p>
        </Card>
      )}

      {/* Mensaje para equipos */}
      {!isJury && (
        <Card className="text-center">
          <p className="text-text-muted text-sm">El jurado está votando...</p>
        </Card>
      )}
    </motion.div>
  );
}
