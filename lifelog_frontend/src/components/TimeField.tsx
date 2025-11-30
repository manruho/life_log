import React, { useEffect, useMemo, useRef, useState } from "react";

interface TimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const ITEM_HEIGHT = 52;
const VISIBLE_ROWS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const EDGE_PADDING = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

const ensureValueString = (val?: string) => {
  if (val && val.includes("T")) return val;
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
};

const parseValue = (raw: string) => {
  const safe = ensureValueString(raw);
  const [datePart, timePart = "00:00"] = safe.split("T");
  const [hourStr = "0", minuteStr = "0"] = timePart.split(":");
  const date = new Date(
    Number(datePart.slice(0, 4)),
    Number(datePart.slice(5, 7)) - 1,
    Number(datePart.slice(8, 10))
  );
  return {
    datePart,
    hour: Number(hourStr),
    minute: Number(minuteStr),
    displayLabel: date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      weekday: "short",
    }),
  };
};

const pad = (num: number) => num.toString().padStart(2, "0");

interface WheelProps {
  options: number[];
  value: number;
  onChange: (value: number) => void;
}

const TimeWheel: React.FC<WheelProps> = ({ options, value, onChange }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const snapTimeoutRef = useRef<number>();
  const [visibleIndex, setVisibleIndex] = useState(() => Math.max(0, options.indexOf(value)));
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  useEffect(() => {
    return () => {
      if (snapTimeoutRef.current) window.clearTimeout(snapTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!scrollRef.current || isUserScrolling) return;
    const index = options.indexOf(value);
    if (index >= 0) {
      scrollRef.current.scrollTop = index * ITEM_HEIGHT + EDGE_PADDING;
      setVisibleIndex(index);
    }
  }, [options, value, isUserScrolling]);

  const snapToNearest = () => {
    if (!scrollRef.current) return;
    const rawIndex = (scrollRef.current.scrollTop - EDGE_PADDING) / ITEM_HEIGHT;
    const index = Math.round(rawIndex);
    const clamped = Math.max(0, Math.min(options.length - 1, index));
    const nextValue = options[clamped];
    setVisibleIndex(clamped);
    onChange(nextValue);
    scrollRef.current.scrollTo({ top: clamped * ITEM_HEIGHT + EDGE_PADDING, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (snapTimeoutRef.current) window.clearTimeout(snapTimeoutRef.current);
    if (scrollRef.current) {
      const rawIndex = (scrollRef.current.scrollTop - EDGE_PADDING) / ITEM_HEIGHT;
      const index = Math.round(rawIndex);
      const clamped = Math.max(0, Math.min(options.length - 1, index));
      setVisibleIndex(clamped);
    }
    snapTimeoutRef.current = window.setTimeout(() => snapToNearest(), 120);
  };

  const handlePointerDown = () => setIsUserScrolling(true);
  const handlePointerUp = () => {
    setIsUserScrolling(false);
    snapToNearest();
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 pointer-events-none h-12 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur" />
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white via-white/90 to-transparent pointer-events-none rounded-t-[32px]" />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none rounded-b-[32px]" />
      <div
        ref={scrollRef}
        className="overflow-y-scroll no-scrollbar wheel-scroll snap-y snap-mandatory"
        style={{ height: `${CONTAINER_HEIGHT}px`, paddingTop: `${EDGE_PADDING}px`, paddingBottom: `${EDGE_PADDING}px` }}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
      >
        {options.map((option) => (
          <div
            key={option}
            className="h-12 flex items-center justify-center text-4xl font-bold tracking-tight transition-all duration-200 snap-center"
            style={{
              color: options[visibleIndex] === option ? "#0b1220" : "rgba(15, 23, 42, 0.15)",
              opacity: options[visibleIndex] === option ? 1 : 0.25,
              transform: options[visibleIndex] === option ? "scale(1)" : "scale(0.9)",
            }}
          >
            {pad(option)}
          </div>
        ))}
      </div>
    </div>
  );
};

export const TimeField: React.FC<TimeFieldProps> = ({ label, value, onChange }) => {
  const parsed = useMemo(() => parseValue(value), [value]);

  const updateTime = (nextHour: number, nextMinute: number) => {
    const safeHour = Math.max(0, Math.min(23, nextHour));
    const safeMinute = Math.max(0, Math.min(59, nextMinute));
    const nextValue = `${parsed.datePart}T${pad(safeHour)}:${pad(safeMinute)}`;
    onChange(nextValue);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-card">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <TimeWheel options={HOURS} value={parsed.hour} onChange={(hour) => updateTime(hour, parsed.minute)} />
          <div className="text-4xl font-bold text-slate-300">:</div>
          <TimeWheel options={MINUTES} value={parsed.minute} onChange={(minute) => updateTime(parsed.hour, minute)} />
        </div>
        <div className="text-xs text-slate-400 mt-3 text-center">{parsed.displayLabel}</div>
      </div>
    </div>
  );
};
