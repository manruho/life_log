import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "../components/ActionButton";
import { BottomSheet } from "../components/BottomSheet";
import { EventList } from "../components/EventList";
import { HeaderSummary } from "../components/HeaderSummary";
import { ValueBar } from "../components/ValueBar";
import { TimeField } from "../components/TimeField";
import { createEvent, deleteEvent, fetchEvents } from "../api/eventsApi";
import { fetchSummary } from "../api/summaryApi";
import { DailySummary } from "../types/Summary";
import { EventType, LifelogEvent } from "../types/Event";

type FormState = {
  timestamp: string;
  mood?: number;
  condition?: number;
  wake_satisfaction?: number;
  second_sleep?: boolean;
  study_hours?: number;
  note?: string;
};

const nowLocalInput = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
};

const localDateKey = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

export const HomePage = () => {
  const [todayKey, setTodayKey] = useState(localDateKey());
  const [events, setEvents] = useState<LifelogEvent[]>([]);
  const [activeSheet, setActiveSheet] = useState<EventType | null>(null);
  const [form, setForm] = useState<FormState>({ timestamp: nowLocalInput() });
  const [todaySummary, setTodaySummary] = useState<DailySummary | undefined>();
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [eventData, summaryData] = await Promise.all([fetchEvents(todayKey), fetchSummary("7d")]);
      setEvents(eventData);
      const today = summaryData.find((s) => s.date === todayKey);
      setTodaySummary(today);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [todayKey]);

  // Date key をローカル日付基準で定期的に更新（タイムゾーンずれ対策）
  useEffect(() => {
    const timer = setInterval(() => {
      setTodayKey(localDateKey());
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setForm({
      timestamp: nowLocalInput(),
      mood: 0,
      condition: 3,
      wake_satisfaction: 3,
      second_sleep: false,
      study_hours: 1.5,
      note: "",
    });
  }, [activeSheet]);

  const openNapButtonType: EventType = useMemo(() => {
    const napEvents = events.filter((e) => e.event_type === "nap_start" || e.event_type === "nap_end");
    if (!napEvents.length) return "nap_start";
    const last = napEvents[napEvents.length - 1];
    return last.event_type === "nap_start" ? "nap_end" : "nap_start";
  }, [events]);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const saveEvent = async (eventType: EventType, extra: Partial<FormState>) => {
    try {
      await createEvent({
        event_type: eventType,
        timestamp: extra.timestamp || form.timestamp,
        mood: extra.mood,
        condition: extra.condition,
        wake_satisfaction: extra.wake_satisfaction,
        second_sleep: extra.second_sleep,
        study_hours: extra.study_hours,
        note: extra.note,
      });
      setActiveSheet(null);
      await refresh();
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました。ネットワークとAPI接続を確認してください。");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEvent(id);
      await refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <HeaderSummary summary={todaySummary} dateLabel={todayLabel} />

      <div className="space-y-3">
        <ActionButton label="就寝開始" description="寝る前にスワイプ/タップで入力" accent onClick={() => setActiveSheet("sleep_start")} />
        <ActionButton label="起床" description="起きたら記録" onClick={() => setActiveSheet("wake_up")} />
        <ActionButton label="気分チェック" description="今の気分と体調" onClick={() => setActiveSheet("mood")} />
        <ActionButton
          label={openNapButtonType === "nap_start" ? "昼寝開始" : "昼寝終了"}
          description="昼寝の前後で記録"
          onClick={() => setActiveSheet(openNapButtonType)}
        />
        <ActionButton label="今日の勉強時間" description="勉強した時間をまとめて入力" onClick={() => setActiveSheet("study_summary")} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">今日のタイムライン</h3>
          {loading && <span className="text-xs text-slate-400">更新中...</span>}
        </div>
        <div className="text-[11px] text-slate-400 mb-2">左にスワイプで削除</div>
        <EventList events={events} onDelete={handleDelete} />
      </div>

      <BottomSheet open={activeSheet === "sleep_start"} title="寝る" onClose={() => setActiveSheet(null)}>
        <TimeField label="時刻" value={form.timestamp} onChange={(value) => setForm((f) => ({ ...f, timestamp: value }))} />
        <label className="flex flex-col gap-1 text-sm">
          <span>気分 (-2..2)</span>
          <input
            type="number"
            min={-2}
            max={2}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={form.mood ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, mood: Number(e.target.value) }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>メモ</span>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={form.note ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </label>
        <button
          className="w-full bg-accent text-white rounded-xl py-3 font-semibold"
          onClick={() => saveEvent("sleep_start", form)}
        >
          保存
        </button>
      </BottomSheet>

      <BottomSheet open={activeSheet === "wake_up"} title="起きた" onClose={() => setActiveSheet(null)}>
        <TimeField label="時刻" value={form.timestamp} onChange={(value) => setForm((f) => ({ ...f, timestamp: value }))} />
        <ValueBar
          label="起床の満足度 (1-5)"
          min={1}
          max={5}
          value={form.wake_satisfaction ?? 3}
          onChange={(val) => setForm((f) => ({ ...f, wake_satisfaction: val }))}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.second_sleep ?? false}
            onChange={(e) => setForm((f) => ({ ...f, second_sleep: e.target.checked }))}
          />
          二度寝した？
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>メモ</span>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={form.note ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </label>
        <button
          className="w-full bg-accent text-white rounded-xl py-3 font-semibold"
          onClick={() => saveEvent("wake_up", form)}
        >
          保存
        </button>
      </BottomSheet>

      <BottomSheet open={activeSheet === "mood"} title="気分チェック" onClose={() => setActiveSheet(null)}>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "とても悪い", value: -2, bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
            { label: "悪い", value: -1, bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700" },
            { label: "普通", value: 0, bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700" },
            { label: "良い", value: 1, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
            { label: "とても良い", value: 2, bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
          ].map((item) => {
            const active = form.mood === item.value;
            const activeRing = active ? "ring-2 ring-offset-2 ring-offset-white" : "";
            return (
              <button
                key={item.value}
                className={`py-2 px-2 rounded-xl border text-xs text-center ${item.bg} ${item.border} ${item.text} ${activeRing} transition`}
                onClick={() => setForm((f) => ({ ...f, mood: item.value }))}
              >
                <div className="font-semibold">{item.label}</div>
                <div className="text-[11px] opacity-70">({item.value})</div>
              </button>
            );
          })}
        </div>
        <ValueBar
          label="体調 (1-5)"
          min={1}
          max={5}
          value={form.condition ?? 3}
          onChange={(val) => setForm((f) => ({ ...f, condition: val }))}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span>メモ</span>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={form.note ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </label>
        <button
          className="w-full bg-accent text-white rounded-xl py-3 font-semibold"
          onClick={() => saveEvent("mood", form)}
        >
          保存
        </button>
      </BottomSheet>

      <BottomSheet open={activeSheet === "nap_start"} title="昼寝開始" onClose={() => setActiveSheet(null)}>
        <TimeField label="時刻" value={form.timestamp} onChange={(value) => setForm((f) => ({ ...f, timestamp: value }))} />
        <button
          className="w-full bg-accent text-white rounded-xl py-3 font-semibold"
          onClick={() => saveEvent("nap_start", form)}
        >
          保存
        </button>
      </BottomSheet>

      <BottomSheet open={activeSheet === "nap_end"} title="昼寝終了" onClose={() => setActiveSheet(null)}>
        <TimeField label="時刻" value={form.timestamp} onChange={(value) => setForm((f) => ({ ...f, timestamp: value }))} />
        <button
          className="w-full bg-accent text-white rounded-xl py-3 font-semibold"
          onClick={() => saveEvent("nap_end", form)}
        >
          保存
        </button>
      </BottomSheet>

      <BottomSheet open={activeSheet === "study_summary"} title="今日の勉強時間" onClose={() => setActiveSheet(null)}>
        <label className="flex flex-col gap-1 text-sm">
          <span>勉強時間 (時間)</span>
          <input
            type="number"
            step="0.25"
            min={0}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={form.study_hours ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, study_hours: Number(e.target.value) }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>メモ</span>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={form.note ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </label>
        <button
          className="w-full bg-accent text-white rounded-xl py-3 font-semibold"
          onClick={() => saveEvent("study_summary", form)}
        >
          保存
        </button>
      </BottomSheet>
    </div>
  );
};
