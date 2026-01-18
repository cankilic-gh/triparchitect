import { GoogleGenAI, Type } from "@google/genai";
import { TripData, UserPreferences } from "../types";

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

1. **Scheduled Pins (day_index = 1, 2, 3...):** 4 items per day:
   - Breakfast (time_slot: "Morning", category_icon: "food")
   - Lunch (time_slot: "Lunch", category_icon: "food")
   - Afternoon activity (time_slot: "Afternoon", category_icon: sights/nature/shopping/activity)
   - Dinner (time_slot: "Dinner", category_icon: "food")

2. **Recommended Alternatives (day_index = 0):** 30+ EXTRA places NOT in daily schedule:
   - PRIORITY ORDER (list these first in the array):
     * 5-6 Coffee shops & cafes (category_icon: "food", include "cafe" or "coffee" in name/description)
     * 5-6 Dessert & bakery spots (category_icon: "food", include "dessert", "pastry", "bakery" in description)
   - THEN include:
     * 8-10 Alternative restaurants (breakfast, lunch, dinner options)
     * 5-6 Hidden gems & local favorites
     * 5-6 Additional sights, museums, parks
   - Mix all price tiers ($, $$, $$$)
   - Cover various time slots so user can swap activities

# RATING
For each pin, provide a realistic "rating" (1.0-5.0) based on the place's general reputation and popularity.
Well-known popular spots: 4.2-4.8, Hidden gems: 3.8-4.3, Average places: 3.5-4.0

# OUTPUT SCHEMA
Return ONLY a JSON object matching the requested schema.
`;

export const generateTrip = async (prefs: UserPreferences, apiKey: string): Promise<TripData> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please enter your Gemini API key.");
  }

  console.log('Generating trip with duration:', prefs.duration, 'days');

  const ai = new GoogleGenAI({ apiKey });

  // Generate day list for prompt
  const dayList = Array.from({ length: prefs.duration }, (_, i) => i + 1).join(', ');

  const userPrompt = `
    Destination: ${prefs.destination}
    Duration: ${prefs.duration} days
    Party Size: ${prefs.partySize}
    Interests: ${prefs.interests}

    YOU MUST CREATE PLANS FOR THESE SPECIFIC DAYS: [${dayList}]

    The daily_flow array MUST contain exactly ${prefs.duration} objects with day_num: ${dayList}

    Generate a complete trip plan with:
    - trip_meta: title, duration (must be "${prefs.duration} days"), vibe_tags (max 5 tags)
    - map_pins: This array MUST contain TWO types of pins:

      1. SCHEDULED pins for days 1 through ${prefs.duration}: 4 items PER DAY (total ${prefs.duration * 4} scheduled pins):
         - Breakfast (time_slot: "Morning", category_icon: "food")
         - Lunch (time_slot: "Lunch", category_icon: "food")
         - Afternoon activity (time_slot: "Afternoon", category_icon: sights/nature/shopping/activity)
         - Dinner (time_slot: "Dinner", category_icon: "food")

      2. RECOMMENDED pins (day_index = 0): ${Math.min(20, Math.max(10, 30 - prefs.duration * 2))} alternative places:
         - Coffee shops, cafes, dessert spots, bakeries
         - Alternative restaurants, hidden gems
         Mix all price tiers ($, $$, $$$)

    - daily_flow: MUST have ${prefs.duration} objects, one for each day_num in [${dayList}]

    FAILURE TO GENERATE ALL ${prefs.duration} DAYS IS NOT ACCEPTABLE!
  `;

  // Define the schema for structured output to ensure strict JSON adherence
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: userPrompt,
    config: {
      maxOutputTokens: 16384,
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
              vibe_tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "duration", "vibe_tags"]
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
                cost_tier: { type: Type.STRING, enum: ["$", "$$", "$$$"] },
                rating: { type: Type.NUMBER }
              },
              required: ["id", "day_index", "name", "coordinates", "category_icon", "short_description", "time_slot", "cost_tier", "rating"]
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

  console.log('Generated days:', data.daily_flow?.length, '- Requested:', prefs.duration);
  console.log('Daily flow:', data.daily_flow?.map(d => d.day_num));

  // Validate required fields
  if (!data.map_pins || !data.daily_flow || !data.trip_meta) {
    console.error('Invalid response structure:', data);
    throw new Error("Invalid response structure from AI");
  }

  return data;
};