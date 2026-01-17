import { GoogleGenAI, Type } from "@google/genai";
import { TripData, UserPreferences } from "../types";

// Initialize Gemini
// NOTE: In a real environment, allow the user to input this or handle it securely.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_PROMPT = `
You are "TripArchitect Core," the backend intelligence for a high-end, visual travel planning web application.
Your output drives a frontend interface that features a **Split-Screen Layout**:
1.  **Interactive Map (Left Side):** Requires precise coordinates and category-specific pin types (Food, Gym, Shopping, Nature).
2.  **Glassmorphism Cards (Right Side):** Requires punchy, short, and inviting titles with visually descriptive tags.

# VISUAL & UX CONTEXT
The UI is minimalist, pastel-toned, and image-heavy.
* **Text Constraint:** No walls of text. Descriptions must be "Tweet-length" (max 140 chars).
* **Iconography:** Assign a valid category_icon.
* **Vibe:** "Curated & Exclusive" but accessible.

# MISSION OBJECTIVE
Generate a strict JSON dataset that populates the "Trip Canvas".
1.  **Cluster Logic:** Group activities geographically.
2.  **Kid/Family Check:** Prioritize appropriately based on party size.
3.  **Visual Cues:** Provide a 'image_search_query' for visually stunning background images.

# TWO TYPES OF PINS
You MUST generate TWO categories of map_pins:
1. **Scheduled Pins (day_index = 1, 2, 3...):** 3-4 activities per day that form the main itinerary
2. **Recommended Alternatives (day_index = 0):** 15-20 EXTRA places that are NOT in the daily schedule but are great alternatives
   - Include diverse categories: hidden gems, local favorites, backup restaurants, scenic spots, museums, parks, cafes
   - Mix different price tiers ($, $$, $$$)
   - Cover various time slots so user can swap activities
   - These appear in a "Recommended Places" pool that users can drag into their itinerary

# OUTPUT SCHEMA
Return ONLY a JSON object matching the requested schema.
`;

export const generateTrip = async (prefs: UserPreferences): Promise<TripData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const userPrompt = `
    Destination: ${prefs.destination}
    Duration: ${prefs.duration} days
    Party Size: ${prefs.partySize}
    Interests: ${prefs.interests}

    Generate a complete trip plan with:
    - trip_meta: title, duration, total_estimated_cost, vibe_tags (max 5 tags)
    - map_pins: This array MUST contain TWO types of pins:
      1. SCHEDULED pins (day_index = 1, 2, 3...): 3-4 activities per day for the main itinerary
      2. RECOMMENDED pins (day_index = 0): AT LEAST 15-20 alternative places NOT in daily schedule
         Include: hidden gems, alternative restaurants, scenic viewpoints, local markets, museums, parks, cafes, nightlife
         Mix all categories (food, sights, nature, shopping, activity) and price tiers ($, $$, $$$)
    - daily_flow: array with one entry per day linking ONLY to scheduled pin_ids (not recommended ones)

    IMPORTANT: The recommended pins (day_index = 0) are alternatives users can drag into their itinerary.
    Generate diverse options so users have real choices. All three sections are REQUIRED.
  `;

  // Define the schema for structured output to ensure strict JSON adherence
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          trip_meta: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              duration: { type: Type.STRING },
              total_estimated_cost: {
                type: Type.OBJECT,
                properties: {
                  currency: { type: Type.STRING },
                  amount: { type: Type.NUMBER }
                },
                required: ["currency", "amount"]
              },
              vibe_tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "duration", "total_estimated_cost", "vibe_tags"]
          },
          map_pins: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                day_index: { type: Type.INTEGER },
                name: { type: Type.STRING },
                coordinates: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER }
                  },
                  required: ["lat", "lng"]
                },
                category_icon: { type: Type.STRING, enum: ["food", "sights", "nature", "shopping", "activity"] },
                short_description: { type: Type.STRING },
                image_search_query: { type: Type.STRING },
                time_slot: { type: Type.STRING, enum: ["Morning", "Lunch", "Afternoon", "Dinner"] },
                logistics_note: { type: Type.STRING },
                cost_tier: { type: Type.STRING, enum: ["$", "$$", "$$$"] }
              },
              required: ["id", "day_index", "name", "coordinates", "category_icon", "short_description", "time_slot", "cost_tier"]
            }
          },
          daily_flow: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day_num: { type: Type.INTEGER },
                date: { type: Type.STRING },
                theme: { type: Type.STRING },
                pin_ids: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["day_num", "theme", "pin_ids"]
            }
          }
        },
        required: ["trip_meta", "map_pins", "daily_flow"]
      }
    }
  });

  const text = response.text;
  console.log('API Response:', text);

  if (!text) {
    throw new Error("No response from AI");
  }

  const data = JSON.parse(text) as TripData;

  // Validate required fields
  if (!data.map_pins || !data.daily_flow || !data.trip_meta) {
    console.error('Invalid response structure:', data);
    throw new Error("Invalid response structure from AI");
  }

  return data;
};