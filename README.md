<div align="center">

# TripArchitect

**AI-Powered Travel Planning with Interactive Maps**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

*Plan your perfect trip with AI-generated itineraries and interactive maps*

[Live Demo](https://triparchitect.vercel.app) | [Report Bug](https://github.com/cankilic-gh/triparchitect/issues)

</div>

---

## Overview

TripArchitect is an intelligent travel planning application that uses Google's Gemini AI to generate personalized travel itineraries. Simply enter your destination, dates, and preferences, and let AI create a detailed day-by-day plan with interactive map visualization.

## Features

- **AI-Generated Itineraries** - Personalized travel plans based on your preferences
- **Interactive Maps** - Visualize your trip with Leaflet-powered maps
- **Day-by-Day Planning** - Organized schedule with morning, lunch, afternoon, and dinner activities
- **Smart Recommendations** - Restaurants, attractions, and activities tailored to your vibe
- **PDF Export** - Download your complete itinerary as a PDF
- **Drag & Drop** - Reorder activities to customize your schedule
- **Local Storage** - Your trip data persists across sessions
- **Glassmorphism UI** - Modern, beautiful interface design

## Screenshots

<div align="center">
<img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="TripArchitect Screenshot" width="800"/>
</div>

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, TypeScript |
| **Build Tool** | Vite |
| **AI** | Google Gemini AI |
| **Maps** | Leaflet, React-Leaflet |
| **Charts** | Recharts |
| **PDF** | jsPDF |
| **Icons** | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- Gemini API Key ([Get one here](https://ai.google.dev/))

### Installation

```bash
# Clone the repository
git clone https://github.com/cankilic-gh/triparchitect.git
cd triparchitect

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage

1. **Enter Trip Details**
   - Destination city/country
   - Travel dates
   - Number of travelers
   - Budget preference

2. **Select Your Vibe**
   - Cultural & Historical
   - Food & Culinary
   - Adventure & Nature
   - Relaxation & Wellness
   - Nightlife & Entertainment

3. **Generate Itinerary**
   - Click "Generate Trip" to create your AI-powered plan
   - View activities on the interactive map
   - Drag and drop to reorder activities

4. **Export**
   - Download your itinerary as a PDF
   - Share with travel companions

## Project Structure

```
triparchitect/
├── App.tsx              # Main application component
├── index.tsx            # Entry point
├── types.ts             # TypeScript interfaces
├── components/
│   ├── InputForm.tsx    # Trip input form
│   ├── TripMap.tsx      # Leaflet map component
│   ├── GlassCard.tsx    # Glassmorphism card component
│   └── Icons.tsx        # Category icons
├── services/
│   └── geminiService.ts # Gemini AI integration
└── vite.config.ts       # Vite configuration
```

## API Response Structure

The Gemini AI generates responses in this format:

```typescript
interface TripData {
  trip_meta: {
    title: string;
    vibe_tags: string[];
    destination: string;
  };
  daily_flow: Array<{
    day_num: number;
    theme: string;
    date: string;
  }>;
  map_pins: Array<{
    name: string;
    lat: number;
    lng: number;
    category: string;
    time_slot: 'Morning' | 'Lunch' | 'Afternoon' | 'Dinner';
    short_description: string;
    rating: number;
    cost_tier: string;
    logistics_note: string;
  }>;
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

<div align="center">

**Built with AI by [Can Kilic](https://cankilic.com)**

Part of [TheGridBase](https://thegridbase.com) ecosystem

</div>
