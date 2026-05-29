"use client";

interface PinDisplayProps {
  pin: string;
}

export default function PinDisplay({ pin }: PinDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-text-muted uppercase tracking-wider">
        Código de acceso
      </span>
      <div className="flex gap-2">
        {pin.split("").map((digit, i) => (
          <span
            key={i}
            className="w-12 h-14 flex items-center justify-center bg-surface-light border border-primary/30 rounded-xl text-2xl font-mono font-bold text-primary"
          >
            {digit}
          </span>
        ))}
      </div>
    </div>
  );
}
