import React, { useCallback, useEffect } from 'react';
import { useTripStore } from '../store/tripStore';
import { UserPreferences, TripData } from '../types';
import { generateTrip } from '../services/geminiService';

export const useTripState = () => {
  const store = useTripStore();

  // Scroll active pin into view when selected
  useEffect(() => {
    if (store.selectedPinId && store.viewState === 'result') {
      const el = document.getElementById(`card-${store.selectedPinId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [store.selectedPinId, store.viewState]);

  const handleGenerate = useCallback(async (prefs: UserPreferences) => {
    store.setViewState('loading');
    store.setShowSearchModal(false);
    store.setError(null);

    try {
      const data = await generateTrip(prefs);
      store.setTripData(data);
      store.setViewState('result');
      store.resetFilters();

      // Select first pin of first day
      const firstPin = data.daily_flow?.[0]?.pin_ids?.[0];
      if (firstPin) store.setSelectedPinId(firstPin);
      if (data.daily_flow?.[0]?.day_num) store.setActiveDay(data.daily_flow[0].day_num);
    } catch (e: any) {
      console.error(e);
      store.setError(e.message || "Failed to generate trip. Please try again.");
      store.setViewState(store.tripData ? 'result' : 'landing');
    }
  }, [store]);

  const handleDragStart = useCallback((e: React.DragEvent, pinId: string) => {
    store.setDraggedPin(pinId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pinId);
  }, [store]);

  const handleDragEnd = useCallback(() => {
    store.setDraggedPin(null);
    store.setDragOverDay(null);
  }, [store]);

  const handleDragOver = useCallback((e: React.DragEvent, dayNum: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    store.setDragOverDay(dayNum);
  }, [store]);

  const handleDragLeave = useCallback(() => {
    store.setDragOverDay(null);
  }, [store]);

  const handleDrop = useCallback((e: React.DragEvent, targetDay: number) => {
    e.preventDefault();
    const pinId = e.dataTransfer.getData('text/plain');
    if (pinId) {
      store.movePinToDay(pinId, targetDay);
    }
  }, [store]);

  const handleDeletePin = useCallback((pinId: string) => {
    store.deletePin(pinId);
  }, [store]);

  const handlePinSelect = useCallback((id: string) => {
    store.setSelectedPinId(id);
    const pin = store.tripData?.map_pins.find(p => p.id === id);
    if (pin && pin.day_index > 0) {
      store.setActiveDay(pin.day_index);
    }
  }, [store]);

  const handleCategoryFilterChange = useCallback((filter: typeof store.categoryFilter) => {
    store.setCategoryFilter(filter);
    store.setRecommendedLimit(8);
  }, [store]);

  return {
    // State
    viewState: store.viewState,
    tripData: store.tripData,
    selectedPinId: store.selectedPinId,
    activeDay: store.activeDay,
    error: store.error,
    draggedPin: store.draggedPin,
    dragOverDay: store.dragOverDay,
    recommendedLimit: store.recommendedLimit,
    categoryFilter: store.categoryFilter,
    showSearchModal: store.showSearchModal,

    // Computed
    visiblePins: store.getVisiblePins(),
    allRecommendedPins: store.getAllRecommendedPins(),
    filteredRecommendedPins: store.getFilteredRecommendedPins(),
    recommendedPins: store.getDisplayedRecommendedPins(),
    activeDayTheme: store.getActiveDayTheme(),
    availableCategories: store.getAvailableCategories(),
    hasMoreRecommendations: store.hasMoreRecommendations(),

    // Actions
    handleGenerate,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDeletePin,
    handlePinSelect,
    handleCategoryFilterChange,

    // Direct setters
    setActiveDay: store.setActiveDay,
    setSelectedPinId: store.setSelectedPinId,
    setShowSearchModal: store.setShowSearchModal,
    loadMoreRecommendations: store.loadMoreRecommendations,
    setRecommendedLimit: store.setRecommendedLimit,
  };
};
