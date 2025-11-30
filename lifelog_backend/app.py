import json
import os
import sqlite3
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)


def resolve_database_path() -> str:
    raw_url = os.environ.get("LIFELOG_DATABASE_URL")
    if raw_url:
        if raw_url.startswith("sqlite:///"):
            resolved = raw_url.replace("sqlite:///", "", 1)
        else:
            resolved = raw_url
        directory = os.path.dirname(resolved) or "."
        os.makedirs(directory, exist_ok=True)
        return resolved
    default_path = os.path.join(DATA_DIR, "lifelog.db")
    os.makedirs(os.path.dirname(default_path), exist_ok=True)
    return default_path


DATABASE_PATH = resolve_database_path()


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db() -> None:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            date_key TEXT NOT NULL,
            mood INTEGER,
            condition INTEGER,
            wake_satisfaction INTEGER,
            second_sleep INTEGER,
            study_hours REAL,
            note TEXT,
            extra_json TEXT
        )
        """
    )
    conn.commit()
    conn.close()

# Ensure database exists when the module is imported (e.g., via `flask run`).
init_db()


def parse_timestamp(ts: str) -> datetime:
    # Accept ISO with optional Z suffix.
    cleaned = ts.replace("Z", "+00:00") if ts.endswith("Z") else ts
    try:
        return datetime.fromisoformat(cleaned)
    except ValueError:
        raise ValueError("Invalid timestamp format. Use ISO 8601, e.g., 2025-12-01T23:40:00")


def dict_from_row(row: sqlite3.Row) -> Dict[str, Any]:
    return {k: row[k] for k in row.keys()}


@app.route("/api/events", methods=["GET"])
def list_events():
    date_key = request.args.get("date")
    if not date_key:
        return jsonify({"error": "date query param is required (YYYY-MM-DD)"}), 400

    conn = get_db()
    cur = conn.execute(
        "SELECT * FROM events WHERE date_key = ? ORDER BY timestamp ASC",
        (date_key,),
    )
    events = [dict_from_row(row) for row in cur.fetchall()]
    conn.close()
    return jsonify(events)


@app.route("/api/events", methods=["POST"])
def create_event():
    data = request.get_json(force=True, silent=True) or {}
    event_type = data.get("event_type")
    if not event_type:
        return jsonify({"error": "event_type is required"}), 400

    timestamp = data.get("timestamp")
    now = datetime.now()
    if timestamp:
        try:
            ts = parse_timestamp(timestamp)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
    else:
        ts = now
    timestamp_iso = ts.isoformat()
    date_key = data.get("date_key") or ts.date().isoformat()

    fields = {
        "event_type": event_type,
        "timestamp": timestamp_iso,
        "date_key": date_key,
        "mood": data.get("mood"),
        "condition": data.get("condition"),
        "wake_satisfaction": data.get("wake_satisfaction"),
        "second_sleep": 1 if data.get("second_sleep") else 0 if data.get("second_sleep") is not None else None,
        "study_hours": data.get("study_hours"),
        "note": data.get("note"),
        "extra_json": json.dumps(data.get("extra_json")) if isinstance(data.get("extra_json"), dict) else data.get("extra_json"),
    }

    placeholders = ", ".join(["?"] * len(fields))
    columns = ", ".join(fields.keys())
    values = list(fields.values())

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"INSERT INTO events ({columns}) VALUES ({placeholders})", values)
    conn.commit()
    new_id = cur.lastrowid
    conn.close()

    return jsonify({"id": new_id, **fields}), 201


@app.route("/api/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM events WHERE id = ?", (event_id,))
    conn.commit()
    deleted = cur.rowcount
    conn.close()
    if deleted == 0:
        return jsonify({"error": "Event not found"}), 404
    return jsonify({"status": "deleted", "id": event_id})


def summarize_events(events: List[Dict[str, Any]], target_dates: List[str]) -> List[Dict[str, Any]]:
    summaries: List[Dict[str, Any]] = []
    events_sorted = sorted(events, key=lambda e: parse_timestamp(e["timestamp"]))
    events_by_date: Dict[str, List[Dict[str, Any]]] = {d: [] for d in target_dates}
    for event in events_sorted:
        if event["date_key"] in events_by_date:
            events_by_date[event["date_key"]].append(event)

    for date_key in target_dates:
        day_events = events_by_date.get(date_key, [])
        mood_vals: List[int] = []
        condition_vals: List[int] = []
        total_study = 0.0
        nap_minutes = 0
        nap_count = 0
        second_sleep_flag = False
        wake_satisfaction_vals: List[int] = []

        # Mood and study aggregation.
        for e in day_events:
            if e["event_type"] == "mood" and e.get("mood") is not None:
                mood_vals.append(int(e["mood"]))
            if e["event_type"] == "mood" and e.get("condition") is not None:
                condition_vals.append(int(e["condition"]))
            if e["event_type"] == "study_summary" and e.get("study_hours") is not None:
                total_study += float(e["study_hours"])
            if e["event_type"] == "wake_up":
                if e.get("second_sleep"):
                    second_sleep_flag = True
                if e.get("wake_satisfaction") is not None:
                    wake_satisfaction_vals.append(int(e["wake_satisfaction"]))

        # Nap aggregation from same-day pairs.
        nap_stack: List[datetime] = []
        for e in day_events:
            if e["event_type"] == "nap_start":
                nap_stack.append(parse_timestamp(e["timestamp"]))
            elif e["event_type"] == "nap_end" and nap_stack:
                start = nap_stack.pop()
                end = parse_timestamp(e["timestamp"])
                diff_minutes = max(0, int((end - start).total_seconds() // 60))
                nap_minutes += diff_minutes
                nap_count += 1

        # Sleep duration: first wake_up of the day vs latest prior sleep_start.
        sleep_hours = 0.0
        wake_events = [e for e in day_events if e["event_type"] == "wake_up"]
        sleep_start_dt: Optional[datetime] = None
        if wake_events:
            first_wake = parse_timestamp(wake_events[0]["timestamp"])
            for e in reversed(events_sorted):
                if parse_timestamp(e["timestamp"]) > first_wake:
                    continue
                if e["event_type"] == "sleep_start":
                    sleep_start_dt = parse_timestamp(e["timestamp"])
                    break
            if sleep_start_dt:
                sleep_hours = max(0.0, round((first_wake - sleep_start_dt).total_seconds() / 3600, 2))

        summary = {
            "date": date_key,
            "sleep_hours": sleep_hours,
            "nap_total_minutes": nap_minutes,
            "nap_count": nap_count,
            "study_hours": round(total_study, 2),
            "mood_avg": round(sum(mood_vals) / len(mood_vals), 2) if mood_vals else None,
            "second_sleep": second_sleep_flag,
            "condition_avg": round(sum(condition_vals) / len(condition_vals), 2) if condition_vals else None,
            "wake_satisfaction_avg": round(sum(wake_satisfaction_vals) / len(wake_satisfaction_vals), 2)
            if wake_satisfaction_vals
            else None,
            "sleep_start_time": sleep_start_dt.isoformat() if sleep_start_dt else None,
            "sleep_start_hour": round(
                sleep_start_dt.hour + sleep_start_dt.minute / 60.0, 2
            )
            if sleep_start_dt
            else None,
        }
        summaries.append(summary)

    # Most recent first.
    summaries.sort(key=lambda s: s["date"], reverse=True)
    return summaries


@app.route("/api/summary", methods=["GET"])
def daily_summary():
    range_param = request.args.get("range", "7d")
    try:
        days = int(range_param.replace("d", ""))
    except ValueError:
        days = 7

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days - 1)
    target_dates = [(start_date + timedelta(days=i)).isoformat() for i in range(days)]

    conn = get_db()
    cur = conn.execute("SELECT * FROM events ORDER BY timestamp ASC")
    events = [dict_from_row(row) for row in cur.fetchall()]
    conn.close()

    summaries = summarize_events(events, target_dates)
    return jsonify(summaries)


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
