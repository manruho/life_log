import React from "react";

interface ValueBarProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  helperText?: string;
}

export const ValueBar: React.FC<ValueBarProps> = ({ label, min, max, value, onChange, helperText }) => {
  const clampValue = (val: number) => Math.min(Math.max(val, min), max);
  const safeValue = clampValue(Number.isFinite(value) ? value : min);
  const ratio = (safeValue - min) / (max - min || 1);
  const knobPosition = `${(ratio * 100).toFixed(2)}%`;
  const trackPadding = 16;

  const updateFromPointer = (clientX: number, rect: DOMRect) => {
    const usableWidth = rect.width - trackPadding * 2;
    const relative = (clientX - rect.left - trackPadding) / usableWidth;
    const clamped = Math.min(Math.max(relative, 0), 1);
    const rawValue = Math.round(min + clamped * (max - min));
    onChange(rawValue);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    updateFromPointer(e.clientX, rect);

    const move = (event: PointerEvent) => {
      event.preventDefault();
      updateFromPointer(event.clientX, rect);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className="text-slate-900 font-semibold text-sm">{safeValue}</span>
      </div>
      <div
        className="relative h-12 rounded-2xl bg-white border border-slate-200 overflow-visible touch-none select-none px-4"
        onPointerDown={handlePointerDown}
      >
        <div className="absolute inset-y-0 left-4 right-4 bg-slate-100 rounded-xl" />
        <div className="absolute inset-y-0 left-4 right-4">
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-200 ease-out"
            style={{ left: knobPosition }}
          >
            <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold shadow-card border border-slate-900">
              {safeValue}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between text-[11px] text-slate-400 px-1">
        {Array.from({ length: max - min + 1 }).map((_, idx) => (
          <span key={idx}>{min + idx}</span>
        ))}
      </div>
      {helperText && <div className="text-xs text-slate-400">{helperText}</div>}
    </div>
  );
};
