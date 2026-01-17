import React from 'react';
import { Utensils, Mountain, ShoppingBag, Landmark, Activity, MapPin } from 'lucide-react';
import { CategoryIcon } from '../types';

export const getCategoryIcon = (type: CategoryIcon, className?: string) => {
  const props = { className: className || "w-5 h-5" };
  switch (type) {
    case 'food': return <Utensils {...props} />;
    case 'nature': return <Mountain {...props} />;
    case 'shopping': return <ShoppingBag {...props} />;
    case 'sights': return <Landmark {...props} />;
    case 'activity': return <Activity {...props} />;
    default: return <MapPin {...props} />;
  }
};