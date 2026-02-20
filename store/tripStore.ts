import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TripData, UserPreferences, MapPin, CategoryIcon } from '../types';

const TRIP_DATA_STORAGE_KEY = 'triparchitect_trip_data';

export type ViewState = 'landing' | 'loading' | 'result';

interface TripState {
  // View state
  viewState: ViewState;
  setViewState: (state: ViewState) => void;

  // Trip data
  tripData: TripData | null;
  setTripData: (data: TripData | null) => void;

  // Selection state
  selectedPinId: string | null;
  setSelectedPinId: (id: string | null) => void;

  // Active day
  activeDay: number;
  setActiveDay: (day: number) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;

  // Drag state
  draggedPin: string | null;
  setDraggedPin: (id: string | null) => void;
  dragOverDay: number | null;
  setDragOverDay: (day: number | null) => void;

  // Filter state
  recommendedLimit: number;
  setRecommendedLimit: (limit: number) => void;
  categoryFilter: CategoryIcon | 'all';
  setCategoryFilter: (filter: CategoryIcon | 'all') => void;

  // Modal state
  showSearchModal: boolean;
  setShowSearchModal: (show: boolean) => void;

  // Computed getters
  getVisiblePins: () => MapPin[];
  getAllRecommendedPins: () => MapPin[];
  getFilteredRecommendedPins: () => MapPin[];
  getDisplayedRecommendedPins: () => MapPin[];
  getActiveDayTheme: () => string;
  getAvailableCategories: () => CategoryIcon[];
  hasMoreRecommendations: () => boolean;

  // Actions
  movePinToDay: (pinId: string, targetDay: number) => void;
  deletePin: (pinId: string) => void;
  loadMoreRecommendations: () => void;
  resetFilters: () => void;
  clearTrip: () => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      // Initial state
      viewState: 'landing',
      tripData: null,
      selectedPinId: null,
      activeDay: 1,
      error: null,
      draggedPin: null,
      dragOverDay: null,
      recommendedLimit: 8,
      categoryFilter: 'all',
      showSearchModal: false,

      // Setters
      setViewState: (viewState) => set({ viewState }),
      setTripData: (tripData) => set({ tripData }),
      setSelectedPinId: (selectedPinId) => set({ selectedPinId }),
      setActiveDay: (activeDay) => set({ activeDay }),
      setError: (error) => set({ error }),
      setDraggedPin: (draggedPin) => set({ draggedPin }),
      setDragOverDay: (dragOverDay) => set({ dragOverDay }),
      setRecommendedLimit: (recommendedLimit) => set({ recommendedLimit }),
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setShowSearchModal: (showSearchModal) => set({ showSearchModal }),

      // Computed getters
      getVisiblePins: () => {
        const { tripData, activeDay } = get();
        return tripData?.map_pins.filter(p => p.day_index === activeDay) || [];
      },

      getAllRecommendedPins: () => {
        const { tripData } = get();
        return tripData?.map_pins.filter(p => p.day_index === 0) || [];
      },

      getFilteredRecommendedPins: () => {
        const { categoryFilter } = get();
        const allRecommended = get().getAllRecommendedPins();
        return categoryFilter === 'all'
          ? allRecommended
          : allRecommended.filter(p => p.category_icon === categoryFilter);
      },

      getDisplayedRecommendedPins: () => {
        const { recommendedLimit } = get();
        return get().getFilteredRecommendedPins().slice(0, recommendedLimit);
      },

      getActiveDayTheme: () => {
        const { tripData, activeDay } = get();
        return tripData?.daily_flow.find(d => d.day_num === activeDay)?.theme || 'Explore';
      },

      getAvailableCategories: () => {
        const allRecommended = get().getAllRecommendedPins();
        return [...new Set(allRecommended.map(p => p.category_icon))] as CategoryIcon[];
      },

      hasMoreRecommendations: () => {
        const { recommendedLimit } = get();
        return get().getFilteredRecommendedPins().length > recommendedLimit;
      },

      // Actions
      movePinToDay: (pinId, targetDay) => {
        const { tripData } = get();
        if (!tripData) return;

        const updatedPins = tripData.map_pins.map(pin =>
          pin.id === pinId ? { ...pin, day_index: targetDay } : pin
        );

        const updatedDailyFlow = tripData.daily_flow.map(day => {
          if (day.day_num === targetDay) {
            return { ...day, pin_ids: [...day.pin_ids.filter(id => id !== pinId), pinId] };
          }
          return { ...day, pin_ids: day.pin_ids.filter(id => id !== pinId) };
        });

        set({
          tripData: { ...tripData, map_pins: updatedPins, daily_flow: updatedDailyFlow },
          draggedPin: null,
          dragOverDay: null,
        });
      },

      deletePin: (pinId) => {
        const { tripData, selectedPinId } = get();
        if (!tripData) return;

        const updatedPins = tripData.map_pins.map(pin =>
          pin.id === pinId ? { ...pin, day_index: 0 } : pin
        );

        const updatedDailyFlow = tripData.daily_flow.map(day => ({
          ...day,
          pin_ids: day.pin_ids.filter(id => id !== pinId)
        }));

        set({
          tripData: { ...tripData, map_pins: updatedPins, daily_flow: updatedDailyFlow },
          selectedPinId: selectedPinId === pinId ? null : selectedPinId,
        });
      },

      loadMoreRecommendations: () => {
        const { recommendedLimit } = get();
        set({ recommendedLimit: recommendedLimit + 8 });
      },

      resetFilters: () => {
        set({
          recommendedLimit: 8,
          categoryFilter: 'all',
        });
      },

      clearTrip: () => {
        set({
          tripData: null,
          viewState: 'landing',
          selectedPinId: null,
          activeDay: 1,
          error: null,
          recommendedLimit: 8,
          categoryFilter: 'all',
        });
      },
    }),
    {
      name: TRIP_DATA_STORAGE_KEY,
      partialize: (state) => ({
        tripData: state.tripData,
        viewState: state.tripData ? 'result' : 'landing',
        activeDay: state.activeDay,
        selectedPinId: state.selectedPinId,
      }),
    }
  )
);
