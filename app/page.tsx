"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel, Users, Shield } from "lucide-react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { PIN_LENGTH, NAME_MIN_LENGTH, NAME_MAX_LENGTH } from "@/lib/constants";

export default function Home() {
  const router = useRouter();
  const [showJoin, setShowJoin] = useState(false);
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleJoin = () => {
    setError("");
    if (pin.length !== PIN_LENGTH) {
      setError(`El PIN debe tener ${PIN_LENGTH} dígitos`);
      return;
    }
    if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
      setError(`El nombre debe tener entre ${NAME_MIN_LENGTH} y ${NAME_MAX_LENGTH} caracteres`);
      return;
    }
    // Navegar a la sesión con el PIN
    router.push(`/session/${pin}?name=${encodeURIComponent(name)}`);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Contenido */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm"
      >
        {/* Logo y título */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-20 h-20 rounded-full bg-surface border border-primary/30 flex items-center justify-center">
            <Gavel className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            El Juicio
          </h1>
          <p className="text-text-muted text-sm">
            Debate jurídico interactivo
          </p>
        </div>

        {!showJoin ? (
          /* Opciones principales */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-4 w-full"
          >
            <Button
              size="lg"
              glow
              className="w-full"
              onClick={() => router.push("/host")}
            >
              <Shield className="w-5 h-5 mr-2" />
              Crear Sesión
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => setShowJoin(true)}
            >
              <Users className="w-5 h-5 mr-2" />
              Unirse con PIN
            </Button>
          </motion.div>
        ) : (
          /* Formulario de unirse */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <Card className="flex flex-col gap-4">
              <Input
                label="PIN de la sesión"
                placeholder="000000"
                maxLength={PIN_LENGTH}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                autoFocus
              />
              <Input
                label="Tu nombre"
                placeholder="Escribe tu nombre"
                maxLength={NAME_MAX_LENGTH}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button size="lg" glow className="w-full" onClick={handleJoin}>
                Entrar al Duelo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowJoin(false);
                  setError("");
                }}
              >
                ← Volver
              </Button>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
