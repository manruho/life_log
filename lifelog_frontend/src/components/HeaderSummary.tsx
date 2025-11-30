import React from "react";
import { DailySummary } from "../types/Summary";

interface Props {
  summary?: DailySummary;
  dateLabel: string;
}

export const HeaderSummary: React.FC<Props> = ({ summary, dateLabel }) => {
  return (
    <div className="card mb-4">
      <div className="text-slate-500 text-sm">今日</div>
      <div className="text-xl font-bold mt-1">{dateLabel}</div>
      <div className="text-sm text-slate-600 mt-2">
        {summary
          ? `睡眠: ${summary.sleep_hours ?? 0}h · 昼寝: ${summary.nap_count}回 · 勉強: ${
              summary.study_hours ?? 0
            }h · 気分: ${summary.mood_avg ?? "–"} · 体調: ${summary.condition_avg ?? "–"}`
          : "何か記録すると今日のサマリーが出ます"}
      </div>
    </div>
  );
};
