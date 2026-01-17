import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { GlassCard } from './GlassCard';
import { Plane, Users, Calendar, Sparkles } from 'lucide-react';

interface InputFormProps {
  onSubmit: (prefs: UserPreferences) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState(3);
  const [partySize, setPartySize] = useState('Couple');
  const [interests, setInterests] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;
    onSubmit({ destination, duration, partySize, interests });
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif text-slate-800 mb-2">TripArchitect</h1>
        <p className="text-slate-500">Design your perfect curated journey.</p>
      </div>

      <GlassCard className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-slate-600 gap-2">
              <Plane className="w-4 h-4 text-rose-400" />
              Where to?
            </label>
            <input 
              type="text" 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Kyoto, Paris, Cape Town"
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all text-lg placeholder:text-slate-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-slate-600 gap-2">
                <Calendar className="w-4 h-4 text-rose-400" />
                Duration
              </label>
              <select 
                value={duration} 
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                {[1,2,3,4,5,7,10,14].map(d => (
                    <option key={d} value={d}>{d} Days</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-slate-600 gap-2">
                <Users className="w-4 h-4 text-rose-400" />
                Who?
              </label>
              <select 
                value={partySize} 
                onChange={(e) => setPartySize(e.target.value)}
                className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <option value="Solo">Solo Traveler</option>
                <option value="Couple">Couple</option>
                <option value="Family with Kids">Family (Kids)</option>
                <option value="Group of Friends">Friends</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
             <label className="flex items-center text-sm font-medium text-slate-600 gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              Vibe & Interests
            </label>
            <input 
              type="text" 
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. Hidden gems, Architecture, Vegan food"
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-200 placeholder:text-slate-300"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-slate-800 text-white rounded-xl py-4 font-medium shadow-lg shadow-slate-300/50 hover:bg-slate-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Curating...
                </>
            ) : (
                "Generate Itinerary"
            )}
          </button>

        </form>
      </GlassCard>
    </div>
  );
};