// === Constantes del juego ===

// Tiempos por defecto (en segundos)
export const DEFAULT_ARGUMENT_TIME = 180; // 3 minutos
export const DEFAULT_VOTING_TIME = 60; // 1 minuto
export const RECONNECTION_WINDOW = 30; // 30 segundos para reconectar

// Límites de participantes
export const MIN_PARTICIPANTS = 2;
export const MAX_PARTICIPANTS = 30;
export const MIN_TEAM_SIZE = 1;
export const MAX_TEAM_SIZE = 3;

// Límites de caracteres
export const TOPIC_MIN_LENGTH = 10;
export const TOPIC_MAX_LENGTH = 300;
export const ARGUMENT_MIN_LENGTH = 50;
export const ARGUMENT_MAX_LENGTH = 1000;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 30;

// PIN
export const PIN_LENGTH = 6;

// Umbrales de tensión del cronómetro (en segundos restantes)
export const TIMER_WARNING_THRESHOLD = 30; // naranja
export const TIMER_DANGER_THRESHOLD = 10; // rojo + temblor
export const TIMER_CRITICAL_THRESHOLD = 5; // temblor intenso + sonido

// Colores del tema
export const COLORS = {
  background: "#0a1628",
  backgroundLight: "#0f2035",
  primary: "#00d4ff",
  primaryGlow: "rgba(0, 212, 255, 0.3)",
  secondary: "#c0c8d4",
  danger: "#ff2d2d",
  warning: "#ff8c00",
  success: "#00ff88",
  surface: "#1a2a40",
  surfaceLight: "#243447",
  text: "#ffffff",
  textMuted: "#8899aa",
} as const;
