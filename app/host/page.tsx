"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Clock, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import {
  DEFAULT_ARGUMENT_TIME,
  DEFAULT_VOTING_TIME,
  MAX_PARTICIPANTS,
} from "@/lib/constants";
import { generatePin } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function HostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [argumentTime, setArgumentTime] = useState(DEFAULT_ARGUMENT_TIME);
  const [votingTime, setVotingTime] = useState(DEFAULT_VOTING_TIME);
  const [error, setError] = useState("");

  const handleCreateSession = async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Generar PIN único
      let pin = generatePin();
      let attempts = 0;

      // Verificar que el PIN no exista
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from("sessions")
          .select("id")
          .eq("pin", pin)
          .in("status", ["waiting", "in_progress", "voting"])
          .single();

        if (!existing) break;
        pin = generatePin();
        attempts++;
      }

      if (attempts >= 10) {
        setError("No se pudo generar un PIN único. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      // Crear sesión
      const { data: session, error: createError } = await supabase
        .from("sessions")
        .insert({
          pin,
          host_id: crypto.randomUUID(), // Temporal hasta implementar auth
          status: "waiting",
          argument_time: argumentTime,
          voting_time: votingTime,
          max_participants: MAX_PARTICIPANTS,
        })
        .select()
        .single();

      if (createError || !session) {
        setError("Error al crear la sesión. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      // Guardar host_id en localStorage para identificar al moderador
      localStorage.setItem(`host_${session.id}`, session.host_id);

      // Navegar al panel de control de la sesión
      router.push(`/host/session/${session.id}`);
    } catch {
      setError("Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col gap-6"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold">Nueva Sesión</h1>
          <p className="text-text-muted text-sm mt-1">
            Configura los tiempos del debate
          </p>
        </div>

        <Card className="flex flex-col gap-5">
          {/* Tiempo de argumentación */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-secondary font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Tiempo de argumentación
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={60}
                max={600}
                step={30}
                value={argumentTime}
                onChange={(e) => setArgumentTime(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-primary font-mono text-sm w-16 text-right">
                {Math.floor(argumentTime / 60)}:{String(argumentTime % 60).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Tiempo de votación */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-secondary font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Tiempo de votación
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={30}
                max={180}
                step={15}
                value={votingTime}
                onChange={(e) => setVotingTime(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-primary font-mono text-sm w-16 text-right">
                {Math.floor(votingTime / 60)}:{String(votingTime % 60).padStart(2, "0")}
              </span>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            size="lg"
            glow
            className="w-full"
            onClick={handleCreateSession}
            disabled={loading}
          >
            <Plus className="w-5 h-5 mr-2" />
            {loading ? "Creando..." : "Crear Sesión"}
          </Button>
        </Card>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="self-center"
        >
          ← Volver al inicio
        </Button>
      </motion.div>
    </main>
  );
}
