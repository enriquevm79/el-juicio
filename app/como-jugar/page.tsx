"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Gavel,
  Users,
  Shield,
  Timer,
  Vote,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function ComoJugarPage() {
  const router = useRouter();

  const steps = [
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "1. El moderador crea la sesión",
      description:
        "El profesor abre la app, configura los tiempos de debate y votación, y crea una sesión. Se genera un PIN de 6 dígitos.",
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "2. Los participantes se unen",
      description:
        "Los alumnos abren la app en su celular, escriben el PIN y su nombre. El moderador asigna quién es Equipo A (Defensa), Equipo B (Refutación) y quién es Jurado.",
    },
    {
      icon: <Gavel className="w-6 h-6 text-primary" />,
      title: "3. Se carga el tema",
      description:
        "El moderador escribe la pregunta o tema jurídico a debatir. Todos los participantes lo ven en su pantalla.",
    },
    {
      icon: <Timer className="w-6 h-6 text-warning" />,
      title: "4. Fase de argumentación",
      description:
        "Se inicia el debate. Cada equipo tiene un tiempo limitado para escribir su argumento (defensa o refutación). Cuando ambos envían, se pasa automáticamente a votación.",
    },
    {
      icon: <Vote className="w-6 h-6 text-danger" />,
      title: "5. El jurado vota",
      description:
        "El jurado lee ambos argumentos y vota por el más convincente. Cada jurado solo puede votar una vez. Cuando todos votan, se cierra automáticamente.",
    },
    {
      icon: <Trophy className="w-6 h-6 text-success" />,
      title: "6. Resultados",
      description:
        "Se revela el ganador con el conteo de votos. El moderador puede iniciar una nueva ronda con otro tema o cerrar la sesión.",
    },
  ];

  return (
    <main className="flex-1 flex flex-col px-4 py-8 max-w-lg mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">¿Cómo jugar?</h1>
          <p className="text-text-muted text-sm mt-1">
            Guía rápida de El Juicio
          </p>
        </div>

        {/* Qué es */}
        <Card className="border-primary/20">
          <h2 className="text-sm font-bold text-primary mb-2">¿Qué es El Juicio?</h2>
          <p className="text-sm text-foreground leading-relaxed">
            Es un juego de debate en vivo que simula un juicio al estilo Common Law.
            Dos equipos se enfrentan argumentando a favor y en contra de un tema jurídico,
            mientras el resto del grupo actúa como jurado y decide quién argumentó mejor.
          </p>
        </Card>

        {/* Para qué sirve */}
        <Card>
          <h2 className="text-sm font-bold text-secondary mb-2">¿Para qué se puede usar?</h2>
          <ul className="text-sm text-foreground space-y-1.5">
            <li>• Práctica de argumentación jurídica en clase</li>
            <li>• Debates sobre temas de derecho constitucional, penal, civil, etc.</li>
            <li>• Ejercicios de oratoria y persuasión</li>
            <li>• Evaluación participativa entre alumnos</li>
            <li>• Dinámicas de grupo en seminarios y talleres</li>
          </ul>
        </Card>

        {/* Pasos */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-secondary">Paso a paso</h2>
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="flex gap-3 items-start">
                <div className="mt-0.5">{step.icon}</div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {step.title}
                  </p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Roles */}
        <Card>
          <h2 className="text-sm font-bold text-secondary mb-3">Los roles</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-bold text-primary">Moderador (Profesor):</span>
              <span className="text-text-muted"> Crea la sesión, carga el tema, controla tiempos, asigna equipos.</span>
            </div>
            <div>
              <span className="font-bold text-primary">Equipo A — Defensa:</span>
              <span className="text-text-muted"> 1 a 3 personas que argumentan a favor del tema.</span>
            </div>
            <div>
              <span className="font-bold text-danger">Equipo B — Refutación:</span>
              <span className="text-text-muted"> 1 a 3 personas que argumentan en contra.</span>
            </div>
            <div>
              <span className="font-bold text-secondary">Jurado:</span>
              <span className="text-text-muted"> El resto de participantes. Leen los argumentos y votan por el más convincente.</span>
            </div>
          </div>
        </Card>

        {/* Reglas */}
        <Card>
          <h2 className="text-sm font-bold text-secondary mb-2">Reglas importantes</h2>
          <ul className="text-xs text-text-muted space-y-1.5">
            <li>• Máximo 30 participantes por sesión</li>
            <li>• No se puede unir nadie una vez iniciado el debate</li>
            <li>• Cada jurado solo puede votar una vez</li>
            <li>• Los equipos no pueden votar</li>
            <li>• Los argumentos deben tener entre 50 y 1,000 caracteres</li>
            <li>• En caso de empate, el moderador tiene voto de calidad</li>
          </ul>
        </Card>

        {/* Botón volver */}
        <Button
          variant="ghost"
          size="md"
          onClick={() => router.push("/")}
          className="self-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Button>
      </motion.div>
    </main>
  );
}
