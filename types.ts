export interface TripMeta {
  title: string;
  duration: string;
  vibe_tags: string[];
}

export type CategoryIcon = "food" | "sights" | "nature" | "shopping" | "activity";
export type TimeSlot = "Morning" | "Lunch" | "Afternoon" | "Dinner";
export type CostTier = "$" | "$$" | "$$$";

export interface MapPin {
  id: string;
  day_index: number;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  category_icon: CategoryIcon;
  short_description: string;
  image_search_query: string;
  time_slot: TimeSlot;
  logistics_note: string;
  cost_tier: CostTier;
  rating: number;
}

export interface DailyFlow {
  day_num: number;
  date: string;
  theme: string;
  pin_ids: string[];
}

export interface TripData {
  trip_meta: TripMeta;
  map_pins: MapPin[];
  daily_flow: DailyFlow[];
}

export interface UserPreferences {
  destination: string;
  duration: number;
  partySize: string;
  interests: string;
}