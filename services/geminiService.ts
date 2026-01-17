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
    
    Please generate a trip plan following the System Role and Output Schema.
  `;

  // Define the schema for structured output to ensure strict JSON adherence
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
                }
              },
              vibe_tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
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
                  }
                },
                category_icon: { type: Type.STRING, enum: ["food", "sights", "nature", "shopping", "activity"] },
                short_description: { type: Type.STRING },
                image_search_query: { type: Type.STRING },
                time_slot: { type: Type.STRING, enum: ["Morning", "Lunch", "Afternoon", "Dinner"] },
                logistics_note: { type: Type.STRING },
                cost_tier: { type: Type.STRING, enum: ["$", "$$", "$$$"] }
              }
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
              }
            }
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as TripData;
};