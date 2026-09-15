"use client";

import { useEffect, useRef, useState } from "react";
import { formatTime, getTimerState } from "@/lib/utils";
import { secondsLeftUntil } from "@/lib/phases";
import { playTick, playBuzzer } from "@/lib/sounds";

interface TimerProps {
  /** Fecha límite (ISO) guardada en la sesión. null = pausado o sin iniciar */
  endsAt: string | null;
  /** Segundos congelados mientras la sesión está en pausa */
  pausedSecondsLeft?: number | null;
  /** Segundos a mostrar cuando no hay fecha límite ni pausa */
  fallbackSeconds: number;
  /** Se ejecuta una sola vez cuando la cuenta llega a 0 */
  onTimeUp?: () => void;
}

export default function Timer({
  endsAt,
  pausedSecondsLeft = null,
  fallbackSeconds,
  onTimeUp,
}: TimerProps) {
  const [runningSeconds, setRunningSeconds] = useState(() =>
    endsAt ? secondsLeftUntil(endsAt) : 0
  );
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  });

  const isRunning = endsAt !== null;
  const secondsLeft = isRunning
    ? runningSeconds
    : pausedSecondsLeft ?? fallbackSeconds;
  const timerState = getTimerState(secondsLeft);

  useEffect(() => {
    if (!endsAt) return;

    let fired = false;
    const tick = () => {
      const left = secondsLeftUntil(endsAt);
      setRunningSeconds(left);
      if (left === 0 && !fired) {
        fired = true;
        playBuzzer();
        onTimeUpRef.current?.();
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  useEffect(() => {
    if (isRunning && secondsLeft <= 5 && secondsLeft > 0) {
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
      {!isRunning && (
        <span className="text-xs text-text-muted mt-1 uppercase tracking-wider">
          En pausa
        </span>
      )}
      {isRunning && timerState === "critical" && (
        <span className="text-xs text-danger mt-1 uppercase tracking-wider animate-pulse">
          ¡Tiempo!
        </span>
      )}
    </div>
  );
}
