
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DAYS_OF_WEEK } from '../constants';
import { TrainingEvent } from '../types';

interface CalendarProps {
  currentDate: Date;
  events: TrainingEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: TrainingEvent) => void;
  isLoading: boolean;
}

interface EventLayout {
  event: TrainingEvent;
  style: React.CSSProperties;
}

interface LayoutData {
  eventLayouts: EventLayout[];
  weekHeights: number[];
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, events, onDayClick, onEventClick, isLoading }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [layoutData, setLayoutData] = useState<LayoutData>({ eventLayouts: [], weekHeights: [] });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0=Mon
    const days = [];

    // Prev month days
    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(prevMonthLastDay);
      date.setDate(prevMonthLastDay.getDate() - i);
      days.push(date);
    }
    
    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        days.push(new Date(year, month, i));
    }
    
    // Next month days
    const nextMonthDay = new Date(year, month + 1, 1);
    while (days.length % 7 !== 0) {
        days.push(new Date(nextMonthDay));
        nextMonthDay.setDate(nextMonthDay.getDate() + 1);
    }
    return days;
  }, [year, month]);

  useLayoutEffect(() => {
    const grid = gridRef.current;

    if (isLoading || !grid) {
      setLayoutData({ eventLayouts: [], weekHeights: [] });
      return;
    }

    const calculateLayout = () => {
      const firstCell = grid.querySelector<HTMLDivElement>('[data-date]');
      if (!firstCell) return;

      const cellWidth = firstCell.offsetWidth;
      // If grid isn't rendered, observer will catch it on resize.
      if (cellWidth === 0) return;
      
      const MIN_CELL_HEIGHT = 112; // h-28
      const DATE_HEADER_HEIGHT = 32;
      const EVENT_BAR_HEIGHT = 22;
      const EVENT_BAR_MARGIN = 3;
      const EVENT_TOTAL_HEIGHT = EVENT_BAR_HEIGHT + EVENT_BAR_MARGIN;
      const CELL_PADDING_BOTTOM = 8;
      const gap = 4; // gap-1

      const weeks: Date[][] = [];
      for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
      }

      const weekLanes: boolean[][][] = Array.from({ length: weeks.length }, () => []);
      const sortedEvents = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      sortedEvents.forEach(event => {
        const eventStart = new Date(event.startDate + 'T00:00:00');
        const eventEnd = new Date(event.endDate + 'T00:00:00');

        weeks.forEach((week, weekIndex) => {
          const weekStart = week[0];
          const weekEnd = week[6];

          if (eventStart > weekEnd || eventEnd < weekStart) return;

          const segmentStart = eventStart > weekStart ? eventStart : weekStart;
          const segmentEnd = eventEnd < weekEnd ? eventEnd : weekEnd;
          
          const startDayIndex = (segmentStart.getDay() + 6) % 7;
          const duration = (segmentEnd.getTime() - segmentStart.getTime()) / (1000 * 3600 * 24) + 1;
          
          if(duration < 1 || startDayIndex > 6) return;

          let laneIndex = 0;
          while (true) {
            if (!weekLanes[weekIndex][laneIndex]) {
              weekLanes[weekIndex][laneIndex] = new Array(7).fill(false);
            }
            let isFree = true;
            for (let i = 0; i < duration; i++) {
              if (startDayIndex + i > 6 || weekLanes[weekIndex][laneIndex][startDayIndex + i]) {
                isFree = false;
                break;
              }
            }
            if (isFree) {
              for (let i = 0; i < duration; i++) {
                  if(startDayIndex + i < 7) {
                      weekLanes[weekIndex][laneIndex][startDayIndex + i] = true;
                  }
              }
              break;
            }
            laneIndex++;
          }
        });
      });
      
      const maxLanesPerWeek = weeks.map((_, i) => weekLanes[i]?.length || 0);
      const weekHeights = maxLanesPerWeek.map(lanes => 
        Math.max(MIN_CELL_HEIGHT, DATE_HEADER_HEIGHT + (lanes * EVENT_TOTAL_HEIGHT) + CELL_PADDING_BOTTOM)
      );
      
      const weekRowTopOffsets = [0];
      for(let i = 1; i < weeks.length; i++) {
          weekRowTopOffsets.push(weekRowTopOffsets[i - 1] + weekHeights[i - 1] + gap);
      }

      const newLayouts: EventLayout[] = [];
      const eventPlacementLanes: boolean[][][] = Array.from({ length: weeks.length }, () => []);

      sortedEvents.forEach(event => {
        const eventStart = new Date(event.startDate + 'T00:00:00');
        const eventEnd = new Date(event.endDate + 'T00:00:00');

        weeks.forEach((week, weekIndex) => {
          const weekStart = week[0];
          const weekEnd = week[6];

          if (eventStart > weekEnd || eventEnd < weekStart) return;

          const segmentStart = eventStart > weekStart ? eventStart : weekStart;
          const segmentEnd = eventEnd < weekEnd ? eventEnd : weekEnd;
          
          const startDayIndex = (segmentStart.getDay() + 6) % 7;
          const duration = (segmentEnd.getTime() - segmentStart.getTime()) / (1000 * 3600 * 24) + 1;
          
          if(duration < 1 || startDayIndex > 6) return;

          let laneIndex = 0;
          while (true) {
            if (!eventPlacementLanes[weekIndex][laneIndex]) {
              eventPlacementLanes[weekIndex][laneIndex] = new Array(7).fill(false);
            }
            let isFree = true;
            for (let i = 0; i < duration; i++) {
              if (startDayIndex + i > 6 || eventPlacementLanes[weekIndex][laneIndex][startDayIndex + i]) {
                isFree = false;
                break;
              }
            }
            if (isFree) {
              for (let i = 0; i < duration; i++) {
                  if(startDayIndex + i < 7) {
                      eventPlacementLanes[weekIndex][laneIndex][startDayIndex + i] = true;
                  }
              }
              break;
            }
            laneIndex++;
          }
          
          newLayouts.push({
            event,
            style: {
              position: 'absolute',
              top: `${weekRowTopOffsets[weekIndex] + DATE_HEADER_HEIGHT + laneIndex * EVENT_TOTAL_HEIGHT}px`,
              left: `${startDayIndex * (cellWidth + gap)}px`,
              width: `${duration * cellWidth + (duration - 1) * gap}px`,
              height: `${EVENT_BAR_HEIGHT}px`,
            },
          });
        });
      });

      const newLayoutData = { eventLayouts: newLayouts, weekHeights };
      
      setLayoutData(currentLayoutData => {
        if (JSON.stringify(currentLayoutData) !== JSON.stringify(newLayoutData)) {
            return newLayoutData;
        }
        return currentLayoutData;
      });
    };

    const resizeObserver = new ResizeObserver(calculateLayout);
    resizeObserver.observe(grid);

    calculateLayout();

    return () => resizeObserver.disconnect();

  }, [events, isLoading, calendarDays]); 

  const renderDays = () => {
    return calendarDays.map((date, index) => {
      const day = date.getDate();
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const dayDateStr = date.toISOString().split('T')[0];
      
      const weekIndex = Math.floor(index / 7);
      const height = layoutData.weekHeights[weekIndex];
      const style = height ? { height: `${height}px` } : { minHeight: '112px' };

      return (
        <div
          key={dayDateStr}
          data-date={dayDateStr}
          style={style}
          className={`relative bg-white rounded-lg border-2 p-2 group transition-all duration-200
            ${isCurrentMonth ? 'border-black/70' : 'bg-white/50 border-black/30 text-gray-400'}
            ${isToday ? 'border-red-500 border-4' : ''}
            ${isCurrentMonth ? 'cursor-pointer hover:bg-amber-50' : ''}
          `}
          onClick={() => isCurrentMonth && onDayClick(date)}
        >
          <span className={`font-bold ${isToday ? 'text-red-600' : isCurrentMonth ? 'text-gray-800' : ''}`}>{day}</span>
          {isCurrentMonth && (
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
              <span className="text-black font-bold text-lg">+ Add</span>
            </div>
          )}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-center font-bold p-2 bg-amber-300 text-gray-800 rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            {day}
          </div>
        ))}
      </div>
      <div ref={gridRef} className="relative">
        <div className="grid grid-cols-7 gap-1">
          {renderDays()}
        </div>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {layoutData.eventLayouts.map(({ event, style }, index) => (
            <div
              key={`${event.id}-${index}`}
              style={style}
              className={`${event.color} ${event.textColor} rounded-md py-0.5 px-2 text-sm font-bold shadow-md truncate z-10 cursor-pointer pointer-events-auto transition-all duration-200 hover:ring-2 hover:ring-black`}
              onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
            >
              {event.shortName}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
