"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Home, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { playVictory } from "@/lib/sounds";
import type { Session, Vote, Argument } from "@/lib/types";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [arguments_, setArguments] = useState<Argument[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const [sessionRes, votesRes, argsRes] = await Promise.all([
        supabase.from("sessions").select("*").eq("id", sessionId).single(),
        supabase.from("votes").select("*").eq("session_id", sessionId),
        supabase.from("arguments").select("*").eq("session_id", sessionId),
      ]);

      if (sessionRes.data) setSession(sessionRes.data as Session);
      if (votesRes.data) setVotes(votesRes.data as Vote[]);
      if (argsRes.data) setArguments(argsRes.data as Argument[]);
    };

    load();

    // Sonido de victoria
    playVictory();
  }, [sessionId, supabase]);

  if (!session) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-text-muted">Cargando resultados...</p>
      </main>
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

  const teamAArg = arguments_.find((a) => a.team === "team_a");
  const teamBArg = arguments_.find((a) => a.team === "team_b");

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8 max-w-lg mx-auto w-full gap-6">
      {/* Trofeo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <Trophy
          className={`w-24 h-24 ${
            winner === "team_a"
              ? "text-primary"
              : winner === "team_b"
                ? "text-danger"
                : "text-warning"
          }`}
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-center"
      >
        {winner === "team_a"
          ? "¡Gana la Defensa!"
          : winner === "team_b"
            ? "¡Gana la Refutación!"
            : "¡Empate!"}
      </motion.h1>

      {/* Votos */}
      <Card className="w-full">
        <div className="flex h-10 rounded-full overflow-hidden bg-surface-light mb-3">
          {totalVotes > 0 && (
            <>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(teamAVotes / totalVotes) * 100}%` }}
                transition={{ delay: 0.5, duration: 1 }}
                className="bg-primary flex items-center justify-center"
              >
                <span className="text-sm font-bold text-background">
                  {teamAVotes}
                </span>
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(teamBVotes / totalVotes) * 100}%` }}
                transition={{ delay: 0.5, duration: 1 }}
                className="bg-danger flex items-center justify-center"
              >
                <span className="text-sm font-bold text-white">
                  {teamBVotes}
                </span>
              </motion.div>
            </>
          )}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-primary font-medium">
            Equipo A: {teamAVotes} votos
          </span>
          <span className="text-danger font-medium">
            Equipo B: {teamBVotes} votos
          </span>
        </div>
      </Card>

      {/* Tema */}
      <Card className="w-full">
        <p className="text-xs text-text-muted mb-1">Tema debatido:</p>
        <p className="text-foreground font-medium">{session.topic}</p>
      </Card>

      {/* Argumentos */}
      {teamAArg && (
        <Card className="w-full border-l-4 border-l-primary">
          <p className="text-xs text-primary font-bold mb-1">DEFENSA</p>
          <p className="text-sm text-foreground">{teamAArg.content}</p>
        </Card>
      )}
      {teamBArg && (
        <Card className="w-full border-l-4 border-l-danger">
          <p className="text-xs text-danger font-bold mb-1">REFUTACIÓN</p>
          <p className="text-sm text-foreground">{teamBArg.content}</p>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex gap-3 w-full">
        <Button
          variant="secondary"
          size="md"
          className="flex-1"
          onClick={() => router.push("/")}
        >
          <Home className="w-4 h-4 mr-2" />
          Inicio
        </Button>
        <Button
          size="md"
          className="flex-1"
          onClick={() => router.back()}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Nueva Ronda
        </Button>
      </div>
    </main>
  );
}
