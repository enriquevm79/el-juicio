"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatTime, getTimerState } from "@/lib/utils";
import { playTick, playBuzzer } from "@/lib/sounds";

interface TimerProps {
  /** Total de segundos para la cuenta regresiva */
  totalSeconds: number;
  /** Si el timer está activo */
  isRunning: boolean;
  /** Callback cuando llega a 0 */
  onTimeUp?: () => void;
}

export default function Timer({
  totalSeconds,
  isRunning,
  onTimeUp,
}: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  const hasFinished = useRef(false);

  // Mantener ref actualizada sin causar re-renders
  onTimeUpRef.current = onTimeUp;

  const timerState = getTimerState(secondsLeft);

  // Reset cuando cambia totalSeconds
  useEffect(() => {
    setSecondsLeft(totalSeconds);
    hasFinished.current = false;
  }, [totalSeconds]);

  // Intervalo del timer
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          if (!hasFinished.current) {
            hasFinished.current = true;
            playBuzzer();
            // Ejecutar en el siguiente tick para evitar setState durante render
            setTimeout(() => onTimeUpRef.current?.(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Sonido tick en los últimos 5 segundos
  useEffect(() => {
    if (secondsLeft <= 5 && secondsLeft > 0 && isRunning) {
      const volume = Math.min(1, 0.3 + (5 - secondsLeft) * 0.15);
      playTick(volume);
    }
  }, [secondsLeft, isRunning]);

  const stateStyles = {
    normal: "text-primary",
    warning: "text-warning",
    danger: "text-danger animate-shake",
    critical: "text-danger animate-shake-intense",
  };

  const borderStyles = {
    normal: "",
    warning: "",
    danger: "animate-border-flash border-2",
    critical: "animate-border-flash border-4",
  };

  return (
    <div
      className={`
        flex flex-col items-center justify-center p-4 rounded-2xl
        bg-surface border border-secondary/10
        ${borderStyles[timerState]}
      `}
    >
      <span
        className={`
          text-5xl font-mono font-bold tabular-nums
          ${stateStyles[timerState]}
        `}
      >
        {formatTime(secondsLeft)}
      </span>
      {timerState === "critical" && (
        <span className="text-xs text-danger mt-1 uppercase tracking-wider animate-pulse">
          ¡Tiempo!
        </span>
      )}
    </div>
  );
}
