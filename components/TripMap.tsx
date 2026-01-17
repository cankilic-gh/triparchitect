import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from '../types';
import { getCategoryIcon } from './Icons';
import { renderToStaticMarkup } from 'react-dom/server';

interface TripMapProps {
  pins: MapPin[];
  selectedPinId: string | null;
  onPinSelect: (id: string) => void;
}

// Component to handle map bounds updates
const MapController = ({ pins, selectedPinId }: { pins: MapPin[], selectedPinId: string | null }) => {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) return;

    if (selectedPinId) {
        const pin = pins.find(p => p.id === selectedPinId);
        if (pin) {
            map.flyTo([pin.coordinates.lat, pin.coordinates.lng], 15, {
                animate: true,
                duration: 1.5
            });
        }
    } else {
        const bounds = L.latLngBounds(pins.map(p => [p.coordinates.lat, p.coordinates.lng]));
        if (bounds.isValid()) {
             map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
  }, [pins, selectedPinId, map]);

  return null;
};

// Custom DivIcon creator using static markup to avoid async rendering issues in Leaflet
const createCustomIcon = (type: any, isSelected: boolean) => {
    // Determine color based on type
    let bgClass = "bg-slate-800";
    if (type === 'food') bgClass = "bg-rose-400";
    if (type === 'nature') bgClass = "bg-emerald-400";
    if (type === 'sights') bgClass = "bg-amber-400";
    
    // Icon sizing logic
    const sizeClass = isSelected ? "w-10 h-10 ring-4 ring-white scale-110" : "w-8 h-8";
    
    // Generate static HTML for the icon
    const iconHtml = renderToStaticMarkup(
        <div className={`flex items-center justify-center ${bgClass} ${sizeClass} rounded-full text-white shadow-xl border-2 border-white/20`}>
             {getCategoryIcon(type, "w-4 h-4")}
        </div>
    );
    
    return L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-icon', // Defined in index.html to remove default styles
        iconSize: isSelected ? [40, 40] : [32, 32],
        iconAnchor: isSelected ? [20, 20] : [16, 16]
    });
};

export const TripMap: React.FC<TripMapProps> = ({ pins, selectedPinId, onPinSelect }) => {
  // Filter only assigned pins (day_index > 0)
  const visiblePins = pins.filter(p => p.day_index > 0);

  // Default center (Rome) if no pins
  const center: [number, number] = visiblePins.length > 0
    ? [visiblePins[0].coordinates.lat, visiblePins[0].coordinates.lng]
    : [41.9028, 12.4964];

  return (
    <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 1, position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        zoomControl={false}
        className="bg-stone-100"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      <MapController pins={visiblePins} selectedPinId={selectedPinId} />

      {visiblePins.map((pin) => (
        <Marker
            key={pin.id}
            position={[pin.coordinates.lat, pin.coordinates.lng]}
            icon={createCustomIcon(pin.category_icon, pin.id === selectedPinId)}
            eventHandlers={{
                click: () => onPinSelect(pin.id)
            }}
        />
      ))}
    </MapContainer>
  );
};