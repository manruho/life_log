import React, { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { LifelogEvent } from "../types/Event";

function formatTime(ts: string) {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function description(e: LifelogEvent) {
  switch (e.event_type) {
    case "sleep_start":
      return "就寝";
    case "wake_up":
      return `起床${e.wake_satisfaction ? ` (満足度 ${e.wake_satisfaction}/5)` : ""}`;
    case "mood":
      return `気分 ${e.mood ?? "?"}${e.condition ? ` · 体調 ${e.condition}/5` : ""}`;
    case "nap_start":
      return "昼寝開始";
    case "nap_end":
      return "昼寝終了";
    case "study_summary":
      return `勉強 ${e.study_hours ?? 0}h`;
    default:
      return e.event_type;
  }
}

interface Props {
  event: LifelogEvent;
  onDelete: (id: number) => void;
}

const LABELS: Record<string, string> = {
  sleep_start: "就寝",
  wake_up: "起床",
  mood: "気分",
  nap_start: "昼寝開始",
  nap_end: "昼寝終了",
  study_summary: "勉強",
};

export const EventListItem: React.FC<Props> = ({ event, onDelete }) => {
  const [offset, setOffset] = useState(0);
  const [removing, setRemoving] = useState(false);
  const maxSwipe = -160;
  const deleteThreshold = -110;

  const handlers = useSwipeable({
    onSwiping: ({ deltaX }) => {
      if (removing) return;
      const next = deltaX < 0 ? Math.max(deltaX, maxSwipe) : Math.min(deltaX, 0);
      setOffset(next);
    },
    onSwiped: ({ deltaX }) => {
      if (removing) return;
      if (deltaX <= deleteThreshold) {
        setOffset(maxSwipe);
        setRemoving(true);
        setTimeout(() => event.id && onDelete(event.id), 160);
      } else {
        setOffset(0);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
    trackTouch: true,
  });

  const triggerDelete = () => {
    if (event.id) {
      setRemoving(true);
      onDelete(event.id);
    }
  };

  return (
    <div className="relative mb-3">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-200 via-rose-300 to-rose-400 flex items-center justify-end pr-6">
        <div className="text-white text-sm tracking-wider">スワイプで削除</div>
      </div>
      <div
        {...handlers}
        className={`card flex items-center gap-3 pr-4 relative z-10 touch-pan-y transition-all duration-200 ${
          removing ? "opacity-0 scale-95" : "opacity-100"
        }`}
        style={{
          transform: `translateX(${offset}px)`,
        }}
      >
        <div className="w-16 text-center text-xs font-semibold text-slate-600">
          <div className="px-2 py-1 rounded-full bg-slate-100">{LABELS[event.event_type] || "記録"}</div>
        </div>
        <div className="flex-1">
          <div className="text-sm text-slate-500">{formatTime(event.timestamp)}</div>
          <div className="font-semibold text-slate-800">{description(event)}</div>
          {event.note && <div className="text-xs text-slate-500 mt-1">{event.note}</div>}
        </div>
        <button
          className={`text-xs font-semibold text-rose-600 border border-transparent rounded-full px-3 py-1 transition ${
            offset <= deleteThreshold / 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
          onClick={triggerDelete}
        >
          削除
        </button>
      </div>
    </div>
  );
};
