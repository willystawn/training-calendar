

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Calendar from './components/Calendar';
import Notes from './components/Notes';
import DownloadButton from './components/DownloadButton';
import EventModal from './components/EventModal';
import { supabase } from './lib/supabaseClient';
import { TrainingEvent } from './types';

const App: React.FC = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    date: Date | null;
    event: TrainingEvent | null;
  }>({ isOpen: false, date: null, event: null });

  // Dynamically load Google Fonts to prevent CORS issues with html-to-image
  useEffect(() => {
    const fontUrl = 'https://fonts.googleapis.com/css2?family=Balsamiq+Sans:wght@400;700&display=swap';
    const loadFonts = async () => {
      try {
        const response = await fetch(fontUrl);
        if (response.ok) {
          const cssText = await response.text();
          const style = document.createElement('style');
          style.textContent = cssText;
          document.head.appendChild(style);
        } else {
          console.error('Failed to load Google Fonts stylesheet.');
        }
      } catch (error) {
        console.error('Error fetching Google Fonts stylesheet:', error);
      }
    };
    loadFonts();
  }, []);


  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Create immutable dates for range calculation to avoid state mutation side effects
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - 7);
    const startDateStr = startDate.toISOString().split('T')[0];

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + 7);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .lte('startDate', endDateStr)
      .gte('endDate', startDateStr)
      .order('startDate', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error.message);
      setEvents([]);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handlePrevMonth = () => {
    setCurrentDate(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
     setCurrentDate(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setModalState({ isOpen: true, date, event: null });
  };
  
  const handleEventClick = (event: TrainingEvent) => {
    setModalState({ isOpen: true, date: null, event });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, date: null, event: null });
  };

  const handleSaveEvent = async (eventData: Omit<TrainingEvent, 'id' | 'created_at'> & { id?: number }) => {
    const { id, ...dataToSave } = eventData;
    let error;

    if (id) {
      // Update existing event
      ({ error } = await supabase.from('events').update(dataToSave).eq('id', id));
    } else {
      // Create new event
      ({ error } = await supabase.from('events').insert(dataToSave));
    }

    if (error) {
      console.error('Error saving event:', error.message);
      alert('Failed to save event. Check the console for details.');
    } else {
      handleCloseModal();
      fetchEvents(); // Refresh events
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
        console.error('Error deleting event:', error);
        alert(`Failed to delete event: ${error.message}`);
    } else {
        handleCloseModal();
        fetchEvents();
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div ref={printRef} className="bg-orange-50 p-6 rounded-2xl relative">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow">
               <div className="flex justify-between items-center mb-6">
                 <h1 className="text-4xl font-bold text-gray-800">
                    {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                 </h1>
                 <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="px-4 py-2 bg-amber-300 text-gray-800 rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-amber-400">&lt;</button>
                    <button onClick={handleToday} className="px-4 py-2 bg-white text-gray-800 rounded-lg border-2 border-black/70 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-gray-100">Today</button>
                    <button onClick={handleNextMonth} className="px-4 py-2 bg-amber-300 text-gray-800 rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-amber-400">&gt;</button>
                 </div>
              </div>
              <Calendar
                currentDate={currentDate}
                events={events}
                onDayClick={handleDayClick}
                onEventClick={handleEventClick}
                isLoading={loading}
              />
            </div>
            <div className="w-full lg:w-96 flex-shrink-0">
              <Notes events={events} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
            <DownloadButton elementRef={printRef} />
        </div>
      </div>
      <EventModal
        modalState={modalState}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
};

export default App;