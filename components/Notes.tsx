import React from 'react';
import { TrainingEvent } from '../types';

interface NotesProps {
  events: TrainingEvent[];
}

const Notes: React.FC<NotesProps> = ({ events }) => {
  // Sort events by start date before processing
  const sortedEvents = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Group events by category
  const groupedEvents = sortedEvents.reduce((acc, event) => {
    const category = event.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(event);
    return acc;
  }, {} as Record<string, TrainingEvent[]>);


  return (
    <div className="bg-white p-4 rounded-lg border-2 border-black/70 shadow-[4px_4px_0px_rgba(0,0,0,1)] h-full overflow-y-auto">
      <div className="text-center font-bold text-xl py-2 mb-4 bg-red-400 text-white rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] sticky top-[-16px] z-10">
        Notes
      </div>
      <div className="space-y-4">
        {Object.keys(groupedEvents).length > 0 ? (
          Object.entries(groupedEvents).map(([category, categoryEvents]) => (
            <div key={category}>
              <h3 className="font-bold text-lg text-gray-800 mb-3 border-b-2 border-black/20 pb-1">{category}</h3>
              <div className="space-y-4">
                {categoryEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4">
                    <div className={`${event.color} ${event.textColor} w-20 h-9 flex items-center justify-center rounded-full text-sm font-bold shadow-md flex-shrink-0`}>
                      {event.shortName}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{event.fullName}</p>
                      <p className="text-sm text-gray-600">{event.trainer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
           <p className="text-center text-gray-500 mt-8">No training events for this month.</p>
        )}
      </div>
    </div>
  );
};

export default Notes;
