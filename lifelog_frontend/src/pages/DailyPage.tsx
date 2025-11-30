import { useEffect, useState } from "react";
import { fetchSummary } from "../api/summaryApi";
import { DailySummary } from "../types/Summary";

export const DailyPage = () => {
  const [days, setDays] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchSummary("30d");
        setDays(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-3">
      <div className="text-2xl font-bold mb-2">日別サマリー</div>
      {loading && <div className="text-sm text-slate-500">読み込み中...</div>}
      {days.map((day) => (
        <div key={day.date} className="card">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-lg">{day.date}</div>
            {day.second_sleep && <span className="text-xs text-accent bg-accent-light px-2 py-1 rounded-full">二度寝</span>}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mt-2">
            <div>睡眠: {day.sleep_hours}h</div>
            <div>昼寝: {day.nap_count}回 ({day.nap_total_minutes}分)</div>
            <div>勉強: {day.study_hours}h</div>
            <div>平均気分: {day.mood_avg ?? "–"}</div>
          </div>
        </div>
      ))}
      {!loading && days.length === 0 && <div className="text-sm text-slate-500">まだデータがありません。</div>}
    </div>
  );
};
