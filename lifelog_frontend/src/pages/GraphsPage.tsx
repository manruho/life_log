import { useEffect, useState } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { fetchSummary } from "../api/summaryApi";
import { DailySummary } from "../types/Summary";

const ranges = ["7d", "30d", "90d"];

export const GraphsPage = () => {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchSummary(range);
        setData(res.filter((d) => d.mood_avg !== null));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const sleepData = data.filter((d) => d.sleep_hours !== null);
  const studyData = data.filter((d) => d.study_hours !== null);
  const conditionData = data.filter((d) => d.condition_avg !== null);
  const bedtimeData = conditionData.filter((d) => d.sleep_start_hour !== null);
  const conditionSleepData = conditionData.filter((d) => d.sleep_hours !== null);

  const aggregateCondition = (
    items: DailySummary[],
    getBucket: (item: DailySummary) => number | null
  ) => {
    const map = new Map<number, { sum: number; count: number }>();
    items.forEach((item) => {
      const bucket = getBucket(item);
      if (bucket === null || Number.isNaN(bucket) || item.condition_avg == null) return;
      const entry = map.get(bucket) ?? { sum: 0, count: 0 };
      entry.sum += item.condition_avg;
      entry.count += 1;
      map.set(bucket, entry);
    });
    return Array.from(map.entries()).map(([bucket, stats]) => ({
      bucket,
      average: parseFloat((stats.sum / stats.count).toFixed(2)),
      count: stats.count,
    }));
  };

  const bedtimeBuckets = aggregateCondition(bedtimeData, (item) =>
    item.sleep_start_hour !== null ? Math.round(item.sleep_start_hour) : null
  );
  const durationBuckets = aggregateCondition(conditionSleepData, (item) =>
    item.sleep_hours !== null ? Math.round(item.sleep_hours) : null
  );

  const bestBedtime = bedtimeBuckets.sort((a, b) => b.average - a.average)[0];
  const bestDuration = durationBuckets.sort((a, b) => b.average - a.average)[0];

  const formatHourLabel = (hour?: number) => {
    if (hour === undefined || hour === null || Number.isNaN(hour)) return "データ不足";
    const normalized = ((hour % 24) + 24) % 24;
    return `${normalized}時台`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">気分の相関</h2>
        <div className="flex gap-2">
          {ranges.map((r) => (
            <button
              key={r}
              className={`text-sm px-3 py-1 rounded-full border ${
                range === r ? "bg-accent text-white border-accent" : "border-slate-200 text-slate-600"
              }`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {loading && <div className="text-sm text-slate-500">読み込み中...</div>}

      <div className="card space-y-3">
        <div className="font-semibold">睡眠インサイト</div>
        <p className="text-sm text-slate-600">
          ログから睡眠と体調の関係をざっくり分析しました。サンプルが多いほど信頼できます。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-slate-100 p-3 bg-slate-50">
            <div className="text-xs text-slate-400 uppercase tracking-widest">ベスト就寝時間</div>
            {bestBedtime ? (
              <>
                <div className="text-xl font-semibold mt-1">{formatHourLabel(bestBedtime.bucket)}</div>
                <div className="text-slate-500 mt-1">
                  体調平均 {bestBedtime.average} / 5（{bestBedtime.count} 日のデータ）
                </div>
              </>
            ) : (
              <div className="text-slate-500 mt-1">データが不足しています</div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-100 p-3 bg-slate-50">
            <div className="text-xs text-slate-400 uppercase tracking-widest">ベスト睡眠時間</div>
            {bestDuration ? (
              <>
                <div className="text-xl font-semibold mt-1">{bestDuration.bucket} 時間前後</div>
                <div className="text-slate-500 mt-1">
                  体調平均 {bestDuration.average} / 5（{bestDuration.count} 日のデータ）
                </div>
              </>
            ) : (
              <div className="text-slate-500 mt-1">データが不足しています</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">睡眠時間 × 気分</div>
        <div className="h-64">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="sleep_hours" name="睡眠" unit="h" />
              <YAxis type="number" dataKey="mood_avg" name="気分" />
              <ZAxis type="category" dataKey="date" name="日付" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={sleepData} fill="#1f9bcf" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">勉強時間 × 気分</div>
        <div className="h-64">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="study_hours" name="勉強" unit="h" />
              <YAxis type="number" dataKey="mood_avg" name="気分" />
              <ZAxis type="category" dataKey="date" name="日付" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={studyData} fill="#34d399" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">就寝時刻 × 体調</div>
        <div className="h-64">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="sleep_start_hour" name="就寝時刻" unit="h" domain={[0, 24]} ticks={[0, 4, 8, 12, 16, 20, 24]} />
              <YAxis type="number" dataKey="condition_avg" name="体調" domain={[1, 5]} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={bedtimeData} fill="#0ea5e9" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">睡眠時間 × 体調</div>
        <div className="h-64">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="sleep_hours" name="睡眠時間" unit="h" />
              <YAxis type="number" dataKey="condition_avg" name="体調" domain={[1, 5]} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={conditionSleepData} fill="#10b981" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
