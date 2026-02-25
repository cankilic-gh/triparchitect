export const config = {
  runtime: 'edge',
};

const SYSTEM_PROMPT = `
You are "TripArchitect Core," the backend intelligence for a high-end, visual travel planning web application.
Your output drives a frontend interface that features a **Split-Screen Layout**:
1.  **Interactive Map (Left Side):** Requires precise coordinates and category-specific pin types (Food, Gym, Shopping, Nature).
2.  **Glassmorphism Cards (Right Side):** Requires punchy, short, and inviting titles with visually descriptive tags.

# VISUAL & UX CONTEXT
The UI is minimalist, pastel-toned, and image-heavy.
* **Text Constraint:** Descriptions MUST be under 80 characters. Be concise!
* **Iconography:** Assign a valid category_icon.
* **Vibe:** "Curated & Exclusive" but accessible.

# MISSION OBJECTIVE
Generate a strict JSON dataset that populates the "Trip Canvas".
1.  **Cluster Logic:** Group activities geographically.
2.  **Kid/Family Check:** Prioritize appropriately based on party size.
3.  **Visual Cues:** Provide a 'image_search_query' for visually stunning background images.

# TWO TYPES OF PINS
You MUST generate TWO categories of map_pins:

1. **Scheduled Pins (day_index = 1, 2, 3...):** 5 items per day:
   - Breakfast → Morning Activity → Lunch → Afternoon Activity → Dinner

2. **Recommended Alternatives (day_index = 0):** 10 places based on user interests
   - Descriptions must be under 50 characters!

# RATING
For each pin, provide a realistic "rating" (1.0-5.0) based on the place's general reputation and popularity.
Well-known popular spots: 4.2-4.8, Hidden gems: 3.8-4.3, Average places: 3.5-4.0

# OUTPUT SCHEMA
Return ONLY a JSON object matching the requested schema.
`;

const responseSchema = {
  type: "OBJECT",
  properties: {
    trip_meta: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        duration: { type: "STRING" },
        vibe_tags: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["title", "duration", "vibe_tags"]
    },
    map_pins: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          day_index: { type: "INTEGER" },
          name: { type: "STRING" },
          coordinates: {
            type: "OBJECT",
            properties: { lat: { type: "NUMBER" }, lng: { type: "NUMBER" } },
            required: ["lat", "lng"]
          },
          category_icon: { type: "STRING", enum: ["food", "sights", "nature", "shopping", "activity"] },
          short_description: { type: "STRING" },
          image_search_query: { type: "STRING" },
          time_slot: { type: "STRING", enum: ["Morning", "Lunch", "Afternoon", "Dinner"] },
          logistics_note: { type: "STRING" },
          cost_tier: { type: "STRING", enum: ["$", "$$", "$$$"] },
          rating: { type: "NUMBER" }
        },
        required: ["id", "day_index", "name", "coordinates", "category_icon", "short_description", "time_slot", "cost_tier", "rating"]
      }
    },
    daily_flow: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          day_num: { type: "INTEGER" },
          date: { type: "STRING" },
          theme: { type: "STRING" },
          pin_ids: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["day_num", "theme", "pin_ids"]
      }
    }
  },
  required: ["trip_meta", "map_pins", "daily_flow"]
};

interface UserPreferences {
  destination: string;
  duration: number;
  partySize: string;
  interests: string;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const prefs: UserPreferences = await req.json();

    if (!prefs.destination || !prefs.duration) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const recommendedCount = prefs.duration > 2 ? 5 : 10;
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

        1. SCHEDULED pins for days 1 through ${prefs.duration}: 5 items PER DAY:
           - Breakfast (time_slot: "Morning", category_icon: "food")
           - Morning activity (time_slot: "Morning", category_icon: sights/nature/activity)
           - Lunch (time_slot: "Lunch", category_icon: "food")
           - Afternoon activity (time_slot: "Afternoon", category_icon: sights/nature/shopping/activity)
           - Dinner (time_slot: "Dinner", category_icon: "food")

        2. RECOMMENDED pins (day_index = 0): ${recommendedCount} places matching "${prefs.interests || 'cafes, desserts'}":
           - Keep descriptions under 50 chars!

      - daily_flow: MUST have ${prefs.duration} objects, one for each day_num in [${dayList}]

      FAILURE TO GENERATE ALL ${prefs.duration} DAYS IS NOT ACCEPTABLE!
    `;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            maxOutputTokens: 32768,
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API HTTP Error:', geminiResponse.status, errText);
      return new Response(JSON.stringify({ error: `Gemini API error: ${geminiResponse.status}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('No text in Gemini response:', JSON.stringify(geminiData));
      return new Response(JSON.stringify({ error: 'No response from AI' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = JSON.parse(text);

    if (!data.map_pins || !data.daily_flow || !data.trip_meta) {
      return new Response(JSON.stringify({ error: 'Invalid response structure from AI' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate trip' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
