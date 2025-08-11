

import React, { useState, useEffect } from 'react';
import { TrainingEvent } from '../types';

interface EventModalProps {
  modalState: {
    isOpen: boolean;
    date: Date | null;
    event: TrainingEvent | null;
  };
  onClose: () => void;
  onSave: (event: Omit<TrainingEvent, 'id' | 'created_at'> & { id?: number }) => void;
  onDelete: (eventId: number) => void;
}

const toInputDate = (date: Date) => date.toISOString().split('T')[0];

const EventModal: React.FC<EventModalProps> = ({ modalState, onClose, onSave, onDelete }) => {
  const { isOpen, date, event } = modalState;
  const [formData, setFormData] = useState({
    fullName: '',
    shortName: '',
    trainer: '',
    category: '',
    startDate: '',
    endDate: '',
    color: 'bg-blue-500',
    textColor: 'text-white',
  });
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);


  useEffect(() => {
    if (isOpen) {
      if (event) {
        setFormData({
            fullName: event.fullName,
            shortName: event.shortName,
            trainer: event.trainer,
            category: event.category || '',
            startDate: event.startDate,
            endDate: event.endDate,
            color: event.color,
            textColor: event.textColor,
        });
      } else if (date) {
        const dateStr = toInputDate(date);
        setFormData({
            fullName: '',
            shortName: '',
            trainer: '',
            category: '',
            startDate: dateStr,
            endDate: dateStr,
            color: 'bg-blue-500',
            textColor: 'text-white',
        });
      }
      setIsConfirmingDelete(false); // Reset confirmation on open or change
    }
  }, [isOpen, event, date]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
        alert("End date cannot be before start date.");
        return;
    }
    if (!formData.category.trim()) {
        alert("Category is required.");
        return;
    }
    const dataToSave = { ...formData, id: event?.id };
    onSave(dataToSave);
  };
  
  const handleDeleteClick = () => {
    if (isConfirmingDelete) {
      if (event?.id) {
        onDelete(event.id);
      }
    } else {
      setIsConfirmingDelete(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-orange-50 rounded-2xl p-8 border-4 border-black/80 shadow-2xl w-full max-w-md relative animate-fade-in">
        <button onClick={onClose} className="absolute top-2 right-4 text-3xl font-bold text-gray-600 hover:text-black">&times;</button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{event ? 'Edit Event' : 'Add New Event'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-bold text-gray-700">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full p-2 border-2 border-black/70 rounded-lg mt-1"/>
          </div>
          <div>
            <label className="font-bold text-gray-700">Short Name (max 4 chars)</label>
            <input type="text" name="shortName" value={formData.shortName} onChange={handleChange} required maxLength={4} className="w-full p-2 border-2 border-black/70 rounded-lg mt-1"/>
          </div>
          <div>
            <label className="font-bold text-gray-700">Trainer</label>
            <input type="text" name="trainer" value={formData.trainer} onChange={handleChange} required className="w-full p-2 border-2 border-black/70 rounded-lg mt-1"/>
          </div>
          <div>
            <label className="font-bold text-gray-700">Category</label>
            <input type="text" name="category" value={formData.category} onChange={handleChange} required className="w-full p-2 border-2 border-black/70 rounded-lg mt-1"/>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
                <label className="font-bold text-gray-700">Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full p-2 border-2 border-black/70 rounded-lg mt-1"/>
            </div>
            <div className="flex-1">
                <label className="font-bold text-gray-700">End Date</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="w-full p-2 border-2 border-black/70 rounded-lg mt-1"/>
            </div>
          </div>
          <div>
            <label className="font-bold text-gray-700">Color</label>
            <select name="color" value={formData.color} onChange={handleChange} className="w-full p-2 border-2 border-black/70 rounded-lg mt-1">
              <option value="bg-teal-500">Teal</option>
              <option value="bg-blue-500">Blue</option>
              <option value="bg-red-500">Red</option>
              <option value="bg-amber-400">Amber</option>
              <option value="bg-purple-500">Purple</option>
              <option value="bg-pink-500">Pink</option>
            </select>
          </div>
          <div className="flex justify-between items-center pt-4">
            <button type="submit" className="bg-green-500 text-white font-bold py-2 px-6 rounded-xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-green-600 active:shadow-none active:translate-x-[3px] active:translate-y-[3px]">Save</button>
            {event && (
                 <button 
                    type="button" 
                    onClick={handleDeleteClick} 
                    onMouseLeave={() => setIsConfirmingDelete(false)}
                    className={`font-bold py-2 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-200 ${
                      isConfirmingDelete ? 'bg-black text-white hover:bg-gray-800' : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {isConfirmingDelete ? 'Confirm Delete' : 'Delete'}
                  </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;