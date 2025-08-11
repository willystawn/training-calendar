import React, { useRef, useState, useEffect, useCallback } from 'react';
import Calendar from './components/Calendar';
import Notes from './components/Notes';
import DownloadButton from './components/DownloadButton';
import EventModal from './components/EventModal';
import { supabase } from './lib/supabaseClient';
import { TrainingEvent } from './types';
import Auth from './components/Auth';
import { Session } from '@supabase/supabase-js';


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    date: Date | null;
    event: TrainingEvent | null;
  }>({ isOpen: false, date: null, event: null });
  const [authLoading, setAuthLoading] = useState(true);


  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setAuthLoading(false);
    };
    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


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
    if (session) {
        fetchEvents();
    }
  }, [fetchEvents, session]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
       <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <svg className="animate-spin h-12 w-12 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div ref={printRef} className="bg-orange-50 p-6 rounded-2xl relative">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow">
               <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                 <h1 className="text-4xl font-bold text-gray-800">
                    {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                 </h1>
                 <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="px-4 py-2 bg-amber-300 text-gray-800 rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-amber-400">&lt;</button>
                    <button onClick={handleToday} className="px-4 py-2 bg-white text-gray-800 rounded-lg border-2 border-black/70 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-gray-100">Today</button>
                    <button onClick={handleNextMonth} className="px-4 py-2 bg-amber-300 text-gray-800 rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-amber-400">&gt;</button>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-red-600">Logout</button>
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
