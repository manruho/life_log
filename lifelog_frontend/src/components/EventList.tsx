import React from "react";
import { LifelogEvent } from "../types/Event";
import { EventListItem } from "./EventListItem";

interface Props {
  events: LifelogEvent[];
  onDelete: (id: number) => void;
}

export const EventList: React.FC<Props> = ({ events, onDelete }) => {
  if (!events.length) {
    return <div className="text-sm text-slate-500">この日の記録はまだありません。</div>;
  }
  return (
    <div>
      {events.map((e) => (
        <EventListItem key={e.id} event={e} onDelete={onDelete} />
      ))}
    </div>
  );
};
