import { PIN_LENGTH } from "./constants";

/**
 * Genera un PIN numérico aleatorio de 6 dígitos.
 * Evita PINs que empiecen con 0.
 */
export function generatePin(): string {
  const min = Math.pow(10, PIN_LENGTH - 1); // 100000
  const max = Math.pow(10, PIN_LENGTH) - 1; // 999999
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * Formatea segundos a mm:ss
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Determina el estado visual del timer basado en segundos restantes
 */
export function getTimerState(
  secondsLeft: number
): "normal" | "warning" | "danger" | "critical" {
  if (secondsLeft <= 5) return "critical";
  if (secondsLeft <= 10) return "danger";
  if (secondsLeft <= 30) return "warning";
  return "normal";
}
