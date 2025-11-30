import React from "react";
import { useSwipeable } from "react-swipeable";

interface Props {
  label: string;
  description?: string;
  accent?: boolean;
  onClick: () => void;
}

export const ActionButton: React.FC<Props> = ({ label, description, accent, onClick }) => {
  const handlers = useSwipeable({
    onSwipedLeft: onClick,
    onSwipedRight: onClick,
    trackTouch: true,
    trackMouse: false,
  });

  return (
    <button
      {...handlers}
      className={`pill-button text-left ${accent ? "bg-accent text-white shadow-lg hover:bg-accent-dark" : "text-slate-900"}`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold tracking-tight">{label}</span>
        {description && (
          <span className={`text-xs ${accent ? "text-slate-200/90" : "text-slate-500"}`}>{description}</span>
        )}
      </div>
      <span className={`text-sm ${accent ? "text-slate-200/90" : "text-slate-400"}`}>スワイプ/タップ</span>
    </button>
  );
};
