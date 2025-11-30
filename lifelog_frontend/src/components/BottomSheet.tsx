import React from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<Props> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />
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
