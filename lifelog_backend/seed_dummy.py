#!/usr/bin/env python3
"""
Seed the SQLite database with dummy lifelog data for testing charts/insights.

Usage:
  python seed_dummy.py --days 30 --reset
"""

from __future__ import annotations

import argparse
import random
import sqlite3
from datetime import datetime, timedelta, time
from pathlib import Path

from app import DATABASE_PATH, init_db


FIELDS = [
  "event_type",
  "timestamp",
  "date_key",
  "mood",
  "condition",
  "wake_satisfaction",
  "second_sleep",
  "study_hours",
  "note",
  "extra_json",
]


def iso(dt: datetime) -> str:
  return dt.replace(microsecond=0).isoformat()


def insert_event(cur: sqlite3.Cursor, event_type: str, dt: datetime, **extra) -> None:
  payload = {
    "event_type": event_type,
    "timestamp": iso(dt),
    "date_key": extra.pop("date_key", dt.date().isoformat()),
    "mood": extra.get("mood"),
    "condition": extra.get("condition"),
    "wake_satisfaction": extra.get("wake_satisfaction"),
    "second_sleep": extra.get("second_sleep"),
    "study_hours": extra.get("study_hours"),
    "note": extra.get("note"),
    "extra_json": extra.get("extra_json"),
  }
  values = [payload[field] for field in FIELDS]
  placeholders = ", ".join(["?"] * len(FIELDS))
  columns = ", ".join(FIELDS)
  cur.execute(f"INSERT INTO events ({columns}) VALUES ({placeholders})", values)


def seed(days: int, reset: bool) -> None:
  init_db()
  conn = sqlite3.connect(DATABASE_PATH)
  cur = conn.cursor()

  if reset:
    cur.execute("DELETE FROM events")
    conn.commit()

  random.seed(42)
  today = datetime.now().date()

  for offset in range(days):
    day = today - timedelta(days=offset)
    # Sleep start the night before (between 21:00 and 01:00)
    sleep_start_hour = random.choice([21, 22, 23, 0, 1])
    sleep_start_min = random.choice([0, 10, 20, 30, 45])
    sleep_start_date = day - timedelta(days=1) if sleep_start_hour >= 18 else day
    sleep_start_dt = datetime.combine(
      sleep_start_date,
      time(hour=sleep_start_hour % 24, minute=sleep_start_min),
    )
    insert_event(
      cur,
      "sleep_start",
      sleep_start_dt,
      note="ダミーデータ: 就寝ログ",
    )

    wake_hour = random.randint(6, 9)
    wake_min = random.choice([0, 15, 30, 45])
    wake_dt = datetime.combine(day, time(hour=wake_hour, minute=wake_min))
    wake_satisfaction = random.randint(2, 5)
    second_sleep = 1 if random.random() < 0.2 else 0
    insert_event(
      cur,
      "wake_up",
      wake_dt,
      wake_satisfaction=wake_satisfaction,
      second_sleep=second_sleep,
      note="ダミーデータ: 起床ログ",
    )

    mood_value = random.choice([-2, -1, 0, 1, 2])
    condition_value = max(
      1,
      min(
        5,
        mood_value + random.randint(2, 4),
      ),
    )
    mood_time = datetime.combine(day, time(hour=13, minute=random.choice([0, 20, 40])))
    insert_event(
      cur,
      "mood",
      mood_time,
      mood=mood_value,
      condition=condition_value,
      note="ダミーデータ: 昼の気分",
    )

    if random.random() < 0.35:
      nap_start_time = datetime.combine(day, time(hour=15, minute=random.choice([0, 20, 40])))
      nap_duration = random.randint(20, 50)
      nap_end_time = nap_start_time + timedelta(minutes=nap_duration)
      insert_event(cur, "nap_start", nap_start_time)
      insert_event(cur, "nap_end", nap_end_time)

    study_hours = round(random.uniform(0.5, 4.5), 1)
    insert_event(
      cur,
      "study_summary",
      datetime.combine(day, time(hour=21, minute=0)),
      study_hours=study_hours,
      note="ダミーデータ: 自習時間",
    )

  conn.commit()
  conn.close()
  print(f"Seeded {days} days of dummy data{' (after reset)' if reset else ''}. DB: {Path(DATABASE_PATH).resolve()}")


def main() -> None:
  parser = argparse.ArgumentParser(description="Seed dummy lifelog events.")
  parser.add_argument("--days", type=int, default=21, help="How many past days to generate")
  parser.add_argument("--reset", action="store_true", help="Delete existing events before seeding")
  args = parser.parse_args()
  seed(args.days, args.reset)


if __name__ == "__main__":
  main()
