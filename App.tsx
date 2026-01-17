import React, { useState, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { generateTrip } from './services/geminiService';
import { TripData, UserPreferences, MapPin } from './types';
import { TripMap } from './components/TripMap';
import { GlassCard } from './components/GlassCard';
import { getCategoryIcon } from './components/Icons';
import { Clock, Navigation, Banknote, ArrowLeft, Star, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export default function App() {
  const [viewState, setViewState] = useState<'landing' | 'loading' | 'result'>('landing');
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (prefs: UserPreferences) => {
    setViewState('loading');
    setError(null);
    try {
      const data = await generateTrip(prefs);
      setTripData(data);
      setViewState('result');
      // Select first pin of first day
      const firstPin = data.daily_flow[0]?.pin_ids[0];
      if (firstPin) setSelectedPinId(firstPin);
    } catch (e) {
      console.error(e);
      setError("Failed to generate trip. Please check your API key and try again.");
      setViewState('landing');
    }
  };

  // Scroll active pin into view when selected
  useEffect(() => {
    if (selectedPinId && viewState === 'result') {
      const el = document.getElementById(`card-${selectedPinId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedPinId, viewState]);

  // Derived data
  const visiblePins = tripData?.map_pins.filter(p => p.day_index === activeDay) || [];
  const activeDayTheme = tripData?.daily_flow.find(d => d.day_num === activeDay)?.theme || "Explore";

  // Chart Data Preparation
  const getCostDistribution = () => {
    if (!tripData) return [];
    const tiers = { "$": 0, "$$": 0, "$$$": 0 };
    tripData.map_pins.forEach(p => tiers[p.cost_tier]++);
    return [
      { name: 'Budget ($)', value: tiers['$'], color: '#4ade80' },
      { name: 'Standard ($$)', value: tiers['$$'], color: '#facc15' },
      { name: 'Luxury ($$$)', value: tiers['$$$'], color: '#f43f5e' }
    ].filter(d => d.value > 0);
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#FDFCF8]">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-rose-100/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-teal-100/50 rounded-full blur-[100px] pointer-events-none" />

      {/* LANDING STATE */}
      {viewState === 'landing' && (
        <div className="h-full flex flex-col items-center justify-center p-6 relative z-10 animate-fade-in">
           <InputForm onSubmit={handleGenerate} isLoading={false} />
           {error && (
             <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
               {error}
             </div>
           )}
        </div>
      )}

      {/* LOADING STATE */}
      {viewState === 'loading' && (
        <div className="h-full flex flex-col items-center justify-center p-6 relative z-10">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-rose-400 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-serif text-slate-800 animate-pulse">Consulting Local Experts...</h2>
          <p className="text-slate-500 mt-2">Curating hidden gems and routing your journey.</p>
        </div>
      )}

      {/* RESULT STATE */}
      {viewState === 'result' && tripData && (
        <div className="h-full w-full flex flex-col md:flex-row relative z-10">
          
          {/* LEFT: MAP (Stacked top on mobile, Left on desktop) */}
          <div className="h-[40vh] md:h-full md:w-[55%] relative order-1 md:order-1 shadow-2xl z-0">
             <TripMap 
                pins={tripData.map_pins} 
                selectedPinId={selectedPinId} 
                onPinSelect={(id) => {
                    setSelectedPinId(id);
                    // Also switch day if necessary
                    const pin = tripData.map_pins.find(p => p.id === id);
                    if (pin) setActiveDay(pin.day_index);
                }} 
             />
             
             {/* Map Overlay Controls */}
             <div className="absolute top-4 left-4 z-[400]">
                <button 
                  onClick={() => setViewState('landing')}
                  className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-white transition-colors text-slate-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
             </div>
          </div>

          {/* RIGHT: CONTENT (Stacked bottom on mobile, Right on desktop) */}
          <div className="h-[60vh] md:h-full md:w-[45%] bg-white/30 backdrop-blur-md border-l border-white/50 flex flex-col order-2 md:order-2">
            
            {/* Header / Meta */}
            <div className="p-6 md:p-8 border-b border-white/20 shrink-0">
              <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-serif text-slate-800 leading-tight mb-2">
                        {tripData.trip_meta.title}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                        {tripData.trip_meta.vibe_tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-slate-800 text-white text-xs rounded-full uppercase tracking-wider font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                     <p className="text-sm text-slate-500">Total Est.</p>
                     <p className="text-xl font-medium text-emerald-600">
                        {tripData.trip_meta.total_estimated_cost.amount} {tripData.trip_meta.total_estimated_cost.currency}
                     </p>
                  </div>
              </div>

              {/* Day Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {tripData.daily_flow.map((day) => (
                    <button
                        key={day.day_num}
                        onClick={() => setActiveDay(day.day_num)}
                        className={`
                            px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border
                            ${activeDay === day.day_num 
                                ? 'bg-rose-400 text-white border-rose-400 shadow-lg shadow-rose-200' 
                                : 'bg-white/50 text-slate-600 border-white/50 hover:bg-white/80'}
                        `}
                    >
                        Day {day.day_num}
                    </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold ml-1">
                {activeDayTheme}
              </p>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 glass-scroll scroll-smooth">
              {visiblePins.map((pin) => (
                <GlassCard 
                    key={pin.id} 
                    className={`border-l-4 ${selectedPinId === pin.id ? 'border-l-rose-400 ring-2 ring-rose-100' : 'border-l-transparent'}`}
                    onClick={() => setSelectedPinId(pin.id)}
                    hoverEffect={true}
                >
                   <div id={`card-${pin.id}`} className="flex gap-4">
                      {/* Image Thumbnail */}
                      <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg overflow-hidden bg-slate-200 shadow-inner">
                        <img 
                            src={`https://image.pollinations.ai/prompt/${encodeURIComponent(pin.image_search_query)}?width=200&height=200&nologo=true`} 
                            alt={pin.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start">
                            <h3 className="text-lg font-medium text-slate-800 truncate pr-2">{pin.name}</h3>
                            <div className="flex gap-1 shrink-0">
                                {Array(pin.cost_tier.length).fill(0).map((_, i) => (
                                    <span key={i} className="text-xs text-slate-400 font-bold">$</span>
                                ))}
                            </div>
                         </div>
                         
                         <div className="flex items-center gap-3 mt-1 mb-2">
                            <div className={`p-1 rounded-md bg-white/50 text-slate-600`}>
                                {getCategoryIcon(pin.category_icon, "w-3 h-3")}
                            </div>
                            <span className="text-xs font-medium text-rose-500 uppercase tracking-wide bg-rose-50 px-2 py-0.5 rounded-full">
                                {pin.time_slot}
                            </span>
                         </div>

                         <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                             {pin.short_description}
                         </p>

                         {/* Logistics Note */}
                         <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 bg-slate-50/50 p-2 rounded-lg">
                            <Navigation className="w-3 h-3" />
                            <span>{pin.logistics_note}</span>
                         </div>
                      </div>
                   </div>
                </GlassCard>
              ))}

              {/* Stats Section at bottom of scroll */}
              <div className="pt-8 pb-4">
                 <h4 className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-4 text-center">Trip Balance</h4>
                 <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={getCostDistribution()}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {getCostDistribution().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="p-4 border-t border-white/20 bg-white/40 backdrop-blur-md shrink-0 flex justify-between items-center">
                <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors">
                    <Download className="w-4 h-4" />
                    Save Itinerary
                </button>
                <div className="flex gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <Star className="w-4 h-4 text-amber-400" />
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}