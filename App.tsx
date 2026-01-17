import React, { useState, useEffect, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { generateTrip } from './services/geminiService';
import { TripData, UserPreferences, MapPin } from './types';
import { TripMap } from './components/TripMap';
import { GlassCard } from './components/GlassCard';
import { getCategoryIcon } from './components/Icons';
import { Clock, Navigation, Banknote, ArrowLeft, Star, Download, Trash2, GripVertical, Sparkles, ChevronDown, Filter, X, Search } from 'lucide-react';
import { CategoryIcon } from './types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const TRIP_DATA_STORAGE_KEY = 'triparchitect_trip_data';

// Generate image URL based on search query
const getImageUrl = (query: string, size: number = 300) => {
  const keywords = encodeURIComponent(query.replace(/[^a-zA-Z0-9 ]/g, '').trim());
  return `https://source.unsplash.com/${size}x${size}/?${keywords},travel`;
};

// Fallback image based on category
const getCategoryFallback = (category: string) => {
  const colors: Record<string, string> = {
    food: 'from-rose-200 to-orange-200',
    nature: 'from-emerald-200 to-teal-200',
    sights: 'from-amber-200 to-yellow-200',
    shopping: 'from-purple-200 to-pink-200',
    activity: 'from-blue-200 to-cyan-200',
  };
  return colors[category] || 'from-slate-200 to-gray-200';
};

export default function App() {
  const [viewState, setViewState] = useState<'landing' | 'loading' | 'result'>('landing');
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [draggedPin, setDraggedPin] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [recommendedLimit, setRecommendedLimit] = useState<number>(8);
  const [categoryFilter, setCategoryFilter] = useState<CategoryIcon | 'all'>('all');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Load trip data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(TRIP_DATA_STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as TripData;
        if (parsed.trip_meta && parsed.map_pins && parsed.daily_flow) {
          setTripData(parsed);
          setViewState('result');
          const firstPin = parsed.daily_flow?.[0]?.pin_ids?.[0];
          if (firstPin) setSelectedPinId(firstPin);
          if (parsed.daily_flow?.[0]?.day_num) setActiveDay(parsed.daily_flow[0].day_num);
        }
      } catch (e) {
        console.error('Failed to parse saved trip data:', e);
        localStorage.removeItem(TRIP_DATA_STORAGE_KEY);
      }
    }
  }, []);

  // Save trip data to localStorage whenever it changes
  useEffect(() => {
    if (tripData && viewState === 'result') {
      localStorage.setItem(TRIP_DATA_STORAGE_KEY, JSON.stringify(tripData));
    }
  }, [tripData, viewState]);

  const handleGenerate = async (prefs: UserPreferences, apiKey: string) => {
    setViewState('loading');
    setShowSearchModal(false);
    setError(null);
    try {
      const data = await generateTrip(prefs, apiKey);
      setTripData(data);
      setViewState('result');
      // Reset filters and limits
      setRecommendedLimit(8);
      setCategoryFilter('all');
      // Select first pin of first day
      const firstPin = data.daily_flow?.[0]?.pin_ids?.[0];
      if (firstPin) setSelectedPinId(firstPin);
      if (data.daily_flow?.[0]?.day_num) setActiveDay(data.daily_flow[0].day_num);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate trip. Please check your API key and try again.");
      setViewState(tripData ? 'result' : 'landing');
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

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, pinId: string) => {
    setDraggedPin(pinId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pinId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedPin(null);
    setDragOverDay(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dayNum: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(dayNum);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverDay(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetDay: number) => {
    e.preventDefault();
    const pinId = e.dataTransfer.getData('text/plain');
    if (!pinId || !tripData) return;

    setTripData(prev => {
      if (!prev) return prev;
      const updatedPins = prev.map_pins.map(pin =>
        pin.id === pinId ? { ...pin, day_index: targetDay } : pin
      );
      const updatedDailyFlow = prev.daily_flow.map(day => {
        if (day.day_num === targetDay) {
          return { ...day, pin_ids: [...day.pin_ids.filter(id => id !== pinId), pinId] };
        }
        return { ...day, pin_ids: day.pin_ids.filter(id => id !== pinId) };
      });
      return { ...prev, map_pins: updatedPins, daily_flow: updatedDailyFlow };
    });

    setDraggedPin(null);
    setDragOverDay(null);
  }, [tripData]);

  const handleDeletePin = useCallback((pinId: string) => {
    if (!tripData) return;
    setTripData(prev => {
      if (!prev) return prev;
      const updatedPins = prev.map_pins.map(pin =>
        pin.id === pinId ? { ...pin, day_index: 0 } : pin
      );
      const updatedDailyFlow = prev.daily_flow.map(day => ({
        ...day,
        pin_ids: day.pin_ids.filter(id => id !== pinId)
      }));
      return { ...prev, map_pins: updatedPins, daily_flow: updatedDailyFlow };
    });
    if (selectedPinId === pinId) setSelectedPinId(null);
  }, [tripData, selectedPinId]);

  // Derived data
  const visiblePins = tripData?.map_pins.filter(p => p.day_index === activeDay) || [];
  const allRecommendedPins = tripData?.map_pins.filter(p => p.day_index === 0) || [];
  const filteredRecommendedPins = categoryFilter === 'all'
    ? allRecommendedPins
    : allRecommendedPins.filter(p => p.category_icon === categoryFilter);
  const recommendedPins = filteredRecommendedPins.slice(0, recommendedLimit);
  const hasMoreRecommendations = filteredRecommendedPins.length > recommendedLimit;
  const activeDayTheme = tripData?.daily_flow.find(d => d.day_num === activeDay)?.theme || "Explore";

  // Get unique categories from recommended pins for filter
  const availableCategories = [...new Set(allRecommendedPins.map(p => p.category_icon))];

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
          <div className="h-[40vh] md:h-full md:w-[55%] relative order-1 md:order-1 shadow-2xl z-0" style={{ minHeight: '300px' }}>
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
                  onClick={() => setShowSearchModal(true)}
                  className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-white transition-colors text-slate-700 flex items-center gap-2"
                  title="New Search"
                >
                  <Search className="w-5 h-5" />
                </button>
             </div>
          </div>

          {/* RIGHT: CONTENT (Stacked bottom on mobile, Right on desktop) */}
          <div className="h-[60vh] md:h-full md:w-[45%] bg-white/30 backdrop-blur-md border-l border-white/50 flex flex-col order-2 md:order-2">
            
            {/* Header / Meta */}
            <div className="p-6 md:p-8 border-b border-white/20 shrink-0 overflow-visible">
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
              <div className="flex gap-2 overflow-x-auto overflow-y-visible pb-4 pt-1 -mb-2 no-scrollbar">
                {tripData.daily_flow.map((day) => (
                    <button
                        key={day.day_num}
                        onClick={() => setActiveDay(day.day_num)}
                        onDragOver={(e) => handleDragOver(e, day.day_num)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day.day_num)}
                        className={`
                            px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border
                            ${activeDay === day.day_num
                                ? 'bg-rose-400 text-white border-rose-400 shadow-lg shadow-rose-200'
                                : 'bg-white/50 text-slate-600 border-white/50 hover:bg-white/80'}
                            ${dragOverDay === day.day_num ? 'ring-2 ring-rose-300 bg-rose-50' : ''}
                        `}
                    >
                        Day {day.day_num}
                    </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold ml-1">
                {activeDayTheme}
              </p>
            </div>

            {/* Scrollable List */}
            <div
              className={`flex-1 overflow-y-auto p-6 md:p-8 space-y-4 glass-scroll scroll-smooth ${dragOverDay === activeDay ? 'bg-rose-50/30' : ''}`}
              onDragOver={(e) => handleDragOver(e, activeDay)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, activeDay)}
            >
              {visiblePins.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Navigation className="w-8 h-8 mb-3 opacity-50" />
                  <p className="text-sm">No activities scheduled for this day</p>
                  <p className="text-xs mt-1">Drag items from Recommended below</p>
                </div>
              )}
              {visiblePins.map((pin) => (
                <div
                  key={pin.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, pin.id)}
                  onDragEnd={handleDragEnd}
                  className={`${draggedPin === pin.id ? 'opacity-50' : ''}`}
                >
                  <GlassCard
                      className={`border-l-4 ${selectedPinId === pin.id ? 'border-l-rose-400 ring-2 ring-rose-100' : 'border-l-transparent'}`}
                      onClick={() => setSelectedPinId(pin.id)}
                      hoverEffect={true}
                  >
                     <div id={`card-${pin.id}`} className="flex gap-4">
                        {/* Drag Handle */}
                        <div className="flex items-center shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 -ml-2">
                          <GripVertical className="w-5 h-5" />
                        </div>

                        {/* Image Thumbnail */}
                        <div className={`w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br ${getCategoryFallback(pin.category_icon)} shadow-inner flex items-center justify-center`}>
                          <img
                              src={getImageUrl(pin.image_search_query, 300)}
                              alt={pin.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start">
                              <h3 className="text-lg font-medium text-slate-800 truncate pr-2">{pin.name}</h3>
                              <div className="flex items-center gap-2 shrink-0">
                                  <div className="flex gap-0.5">
                                      {Array(pin.cost_tier.length).fill(0).map((_, i) => (
                                          <span key={i} className="text-xs text-slate-400 font-bold">$</span>
                                      ))}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePin(pin.id);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                                    title="Remove from day"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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
                </div>
              ))}

              {/* Recommended Pool Section */}
              {allRecommendedPins.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-200/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm uppercase tracking-widest text-slate-400 font-bold">Recommended Places</h4>
                    <span className="text-xs text-slate-300 ml-auto">
                      {filteredRecommendedPins.length} of {allRecommendedPins.length}
                    </span>
                  </div>

                  {/* Category Filter */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                    <button
                      onClick={() => { setCategoryFilter('all'); setRecommendedLimit(8); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                        categoryFilter === 'all'
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white/40 text-slate-500 border-white/50 hover:bg-white/60'
                      }`}
                    >
                      All
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setCategoryFilter(cat); setRecommendedLimit(8); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                          categoryFilter === cat
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white/40 text-slate-500 border-white/50 hover:bg-white/60'
                        }`}
                      >
                        {getCategoryIcon(cat, "w-3 h-3")}
                        <span className="capitalize">{cat}</span>
                      </button>
                    ))}
                  </div>

                  {/* Recommended Cards */}
                  <div className="space-y-3">
                    {recommendedPins.map((pin) => (
                      <div
                        key={pin.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, pin.id)}
                        onDragEnd={handleDragEnd}
                        className={`${draggedPin === pin.id ? 'opacity-50' : ''}`}
                      >
                        <div
                          onClick={() => setSelectedPinId(pin.id)}
                          className={`
                            flex items-center gap-3 p-3 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40
                            hover:bg-white/50 cursor-pointer transition-all group
                            ${selectedPinId === pin.id ? 'ring-2 ring-rose-100 border-rose-200' : ''}
                          `}
                        >
                          <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className={`w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br ${getCategoryFallback(pin.category_icon)} flex items-center justify-center`}>
                            <img
                              src={getImageUrl(pin.image_search_query, 150)}
                              alt={pin.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-slate-700 truncate">{pin.name}</h5>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="p-0.5 rounded bg-white/50 text-slate-500">
                                {getCategoryIcon(pin.category_icon, "w-3 h-3")}
                              </div>
                              <span className="text-xs text-slate-400">{pin.time_slot}</span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-300 font-medium">
                            {pin.cost_tier}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More / Show Less */}
                  {hasMoreRecommendations ? (
                    <button
                      onClick={() => setRecommendedLimit(prev => prev + 8)}
                      className="w-full mt-4 py-2.5 rounded-xl bg-white/40 hover:bg-white/60 border border-white/50 text-sm font-medium text-slate-600 transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Load More ({filteredRecommendedPins.length - recommendedLimit} remaining)
                    </button>
                  ) : recommendedLimit > 8 && filteredRecommendedPins.length > 8 ? (
                    <button
                      onClick={() => setRecommendedLimit(8)}
                      className="w-full mt-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Show Less
                    </button>
                  ) : null}

                  <p className="text-xs text-slate-400 text-center mt-4">
                    Drag items to a day tab or drop zone above
                  </p>
                </div>
              )}

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

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setShowSearchModal(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md animate-fade-in">
            {/* Close button */}
            <button
              onClick={() => setShowSearchModal(false)}
              className="absolute -top-3 -right-3 z-20 p-2 bg-white rounded-full shadow-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Card */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif text-slate-800 mb-1">New Trip</h2>
                <p className="text-slate-500 text-sm">Plan your next adventure</p>
              </div>

              <InputForm onSubmit={handleGenerate} isLoading={viewState === 'loading'} isModal={true} />

              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}