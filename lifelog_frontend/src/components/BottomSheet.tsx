import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<Props> = ({ open, title, onClose, children }) => {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (event: PointerEvent) => {
      if (startYRef.current === null) return;
      const delta = event.clientY - startYRef.current;
      setDragY(delta > 0 ? delta : 0);
    };
    const handleUp = () => {
      if (dragY > 120) {
        onClose();
      }
      setDragY(0);
      setDragging(false);
      startYRef.current = null;
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [dragging, dragY, onClose]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    // 入力フィールド上でのドラッグは無視して誤作動を防ぐ
    if (target.closest("input, textarea, select, button, [data-no-drag]")) return;
    startYRef.current = event.clientY;
    setDragging(true);
  };

  if (!open) return null;
  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} />
      <div
        className="bottom-sheet"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : "transform 0.2s ease-out",
        }}
        onPointerDown={startDrag}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" onPointerDown={startDrag} />
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="text-slate-500 text-sm" onClick={onClose}>
            閉じる
          </button>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </>,
    document.body
  );
};
