"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Trophy, XCircle, Home } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { playGavel } from "@/lib/sounds";
import type { Session, Participant, Vote } from "@/lib/types";

interface ResultsViewProps {
  session: Session;
  participant: Participant;
}

export default function ResultsView({ session }: ResultsViewProps) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadVotes = async () => {
      const { data } = await supabase
        .from("votes")
        .select("*")
        .eq("session_id", session.id);

      if (data) setVotes(data as Vote[]);
    };

    loadVotes();
    playGavel();
  }, [session.id, supabase]);

  if (session.status === "cancelled") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-12"
      >
        <XCircle className="w-16 h-16 text-danger" />
        <h2 className="text-xl font-bold text-danger">Sesión Cancelada</h2>
        <p className="text-text-muted text-sm">
          El moderador ha cancelado esta sesión.
        </p>
        <Button
          variant="secondary"
          size="md"
          onClick={() => window.location.href = "/"}
        >
          <Home className="w-4 h-4 mr-2" />
          Volver al inicio
        </Button>
      </motion.div>
    );
  }

  const teamAVotes = votes.filter((v) => v.voted_for === "team_a").length;
  const teamBVotes = votes.filter((v) => v.voted_for === "team_b").length;
  const totalVotes = votes.length;
  const winner =
    teamAVotes > teamBVotes
      ? "team_a"
      : teamBVotes > teamAVotes
        ? "team_b"
        : "tie";

  const winnerLabel =
    winner === "team_a"
      ? "Equipo A (Defensa)"
      : winner === "team_b"
        ? "Equipo B (Refutación)"
        : "Empate";

  const winnerColor =
    winner === "team_a"
      ? "text-primary"
      : winner === "team_b"
        ? "text-danger"
        : "text-warning";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-8"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
      >
        <Trophy className={`w-20 h-20 ${winnerColor}`} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <p className="text-sm text-text-muted">Ganador</p>
        <h2 className={`text-2xl font-bold ${winnerColor}`}>{winnerLabel}</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="w-full"
      >
        <Card className="w-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-text-muted">Votos totales:</span>
            <span className="text-sm font-bold text-foreground">
              {totalVotes}
            </span>
          </div>

          <div className="flex h-8 rounded-full overflow-hidden bg-surface-light">
            {totalVotes > 0 && (
              <>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(teamAVotes / totalVotes) * 100}%`,
                  }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="bg-primary flex items-center justify-center"
                >
                  {teamAVotes > 0 && (
                    <span className="text-xs font-bold text-background">
                      {teamAVotes}
                    </span>
                  )}
                </motion.div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(teamBVotes / totalVotes) * 100}%`,
                  }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="bg-danger flex items-center justify-center"
                >
                  {teamBVotes > 0 && (
                    <span className="text-xs font-bold text-white">
                      {teamBVotes}
                    </span>
                  )}
                </motion.div>
              </>
            )}
          </div>

          <div className="flex justify-between mt-2 text-xs">
            <span className="text-primary">Equipo A: {teamAVotes}</span>
            <span className="text-danger">Equipo B: {teamBVotes}</span>
          </div>
        </Card>
      </motion.div>

      <Card className="w-full border-secondary/20">
        <p className="text-xs text-text-muted mb-1">Tema debatido:</p>
        <p className="text-sm text-foreground">{session.topic}</p>
      </Card>

      <Button
        variant="secondary"
        size="md"
        className="w-full"
        onClick={() => window.location.href = "/"}
      >
        <Home className="w-4 h-4 mr-2" />
        Volver al inicio
      </Button>
    </motion.div>
  );
}
