import React, { useState, useEffect } from 'react';
import { UserPreferences } from '../types';
import { GlassCard } from './GlassCard';
import { Plane, Users, Calendar, Sparkles, Key, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

const API_KEY_STORAGE_KEY = 'triparchitect_api_key';

interface InputFormProps {
  onSubmit: (prefs: UserPreferences, apiKey: string) => void;
  isLoading: boolean;
  isModal?: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, isModal = false }) => {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState(3);
  const [partySize, setPartySize] = useState('Couple');
  const [interests, setInterests] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSection, setShowApiSection] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setShowApiSection(true);
    }
  }, []);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (value) {
      localStorage.setItem(API_KEY_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;
    if (!apiKey) {
      setShowApiSection(true);
      return;
    }
    onSubmit({ destination, duration, partySize, interests }, apiKey);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className={isModal ? "space-y-4" : "space-y-6"}>
          
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

          {/* API Key Section */}
          <div className="border-t border-slate-200/50 pt-4">
            <button
              type="button"
              onClick={() => setShowApiSection(!showApiSection)}
              className="flex items-center justify-between w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Key {apiKey ? '(saved)' : '(required)'}
              </span>
              {showApiSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showApiSection && (
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Get your free API key from{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-400 hover:underline"
                  >
                    Google AI Studio
                  </a>
                  . Stored locally in your browser.
                </p>
              </div>
            )}
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
  );

  if (isModal) {
    return formContent;
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif text-slate-800 mb-2">TripArchitect</h1>
        <p className="text-slate-500">Design your perfect curated journey.</p>
      </div>
      <GlassCard className="p-8">
        {formContent}
      </GlassCard>
    </div>
  );
};