"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Eye } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Timer from "@/components/ui/Timer";
import { createClient } from "@/lib/supabase/client";
import { ARGUMENT_MIN_LENGTH, ARGUMENT_MAX_LENGTH } from "@/lib/constants";
import type { Session, Participant } from "@/lib/types";

interface DebateViewProps {
  session: Session;
  participant: Participant;
}

export default function DebateView({ session, participant }: DebateViewProps) {
  const [argument, setArgument] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const isTeamMember =
    participant.role === "team_a" || participant.role === "team_b";

  const handleSubmit = async () => {
    // Prevenir doble envío
    if (submitting || submitted) return;

    if (argument.length < ARGUMENT_MIN_LENGTH) {
      setError(`Mínimo ${ARGUMENT_MIN_LENGTH} caracteres`);
      return;
    }
    if (argument.length > ARGUMENT_MAX_LENGTH) {
      setError(`Máximo ${ARGUMENT_MAX_LENGTH} caracteres`);
      return;
    }

    setSubmitting(true);
    const { error: submitError } = await supabase.from("arguments").insert({
      session_id: session.id,
      team: participant.role,
      content: argument.trim(),
    });

    if (submitError) {
      setError("Error al enviar. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
    setError("");
  };

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

      {/* Timer */}
      <Timer
        totalSeconds={session.argument_time}
        isRunning={true}
        onTimeUp={() => {
          // Auto-enviar si el equipo no ha enviado
          if (isTeamMember && !submitted && argument.length >= ARGUMENT_MIN_LENGTH) {
            handleSubmit();
          }
        }}
      />

      {/* Vista según rol */}
      {isTeamMember ? (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-secondary">
              {participant.role === "team_a" ? "Tu Defensa" : "Tu Refutación"}
            </p>
            <span className="text-xs text-text-muted">
              {argument.length}/{ARGUMENT_MAX_LENGTH}
            </span>
          </div>

          {!submitted ? (
            <>
              <textarea
                value={argument}
                onChange={(e) => setArgument(e.target.value)}
                maxLength={ARGUMENT_MAX_LENGTH}
                placeholder="Escribe tu argumento aquí..."
                className="w-full h-40 px-4 py-3 bg-surface-light border border-secondary/20 rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none transition-all"
                disabled={submitting}
              />
              {error && <p className="text-xs text-danger">{error}</p>}
              <Button
                size="md"
                glow
                className="w-full"
                onClick={handleSubmit}
                disabled={argument.length < ARGUMENT_MIN_LENGTH || submitting}
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Enviando..." : "Enviar Argumento"}
              </Button>
              <p className="text-xs text-text-muted text-center">
                Mín. {ARGUMENT_MIN_LENGTH} caracteres
              </p>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-success font-medium">✓ Argumento enviado</p>
              <p className="text-xs text-text-muted mt-1">
                Esperando a que termine el tiempo...
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card className="text-center py-8">
          <Eye className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-foreground font-medium">
            Los equipos están argumentando
          </p>
          <p className="text-sm text-text-muted mt-1">
            Pronto podrás leer sus argumentos y votar
          </p>
        </Card>
      )}
    </motion.div>
  );
}
