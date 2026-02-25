export const config = {
  maxDuration: 60,
};

const JSON_SCHEMA = `{
  "trip_meta": {
    "title": "string",
    "duration": "string (e.g. '3 days')",
    "vibe_tags": ["string (max 5 tags)"]
  },
  "map_pins": [
    {
      "id": "string (unique, e.g. 'pin_1')",
      "day_index": "integer (1,2,3... for scheduled, 0 for recommended)",
      "name": "string",
      "coordinates": { "lat": "number", "lng": "number" },
      "category_icon": "food | sights | nature | shopping | activity",
      "short_description": "string (max 80 chars, max 50 for recommended)",
      "image_search_query": "string",
      "time_slot": "Morning | Lunch | Afternoon | Dinner",
      "logistics_note": "string",
      "cost_tier": "$ | $$ | $$$",
      "rating": "number (1.0-5.0)"
    }
  ],
  "daily_flow": [
    {
      "day_num": "integer",
      "theme": "string",
      "pin_ids": ["string (references map_pins.id)"]
    }
  ]
}`;

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

    const prompt = `You are "TripArchitect Core," a travel planning AI. Generate a curated trip plan as a JSON object.

RULES:
- Descriptions MUST be under 80 chars (under 50 for recommended pins)
- category_icon must be one of: food, sights, nature, shopping, activity
- time_slot must be one of: Morning, Lunch, Afternoon, Dinner
- cost_tier must be one of: $, $$, $$$
- rating must be realistic (1.0-5.0): popular spots 4.2-4.8, hidden gems 3.8-4.3
- Coordinates must be real and accurate
- Group activities geographically within each day

TRIP REQUEST:
- Destination: ${prefs.destination}
- Duration: ${prefs.duration} days
- Party: ${prefs.partySize}
- Interests: ${prefs.interests || 'local food, culture, hidden gems'}

GENERATE:
1. trip_meta with title, duration ("${prefs.duration} days"), and up to 5 vibe_tags
2. map_pins array with TWO types:
   a) SCHEDULED pins (day_index = 1 to ${prefs.duration}): exactly 5 per day:
      Breakfast (Morning/food) → Activity (Morning) → Lunch (Lunch/food) → Activity (Afternoon) → Dinner (Dinner/food)
   b) RECOMMENDED pins (day_index = 0): ${recommendedCount} extra places matching "${prefs.interests || 'cafes, desserts'}"
3. daily_flow: exactly ${prefs.duration} objects for days [${dayList}], each with day_num, theme, and pin_ids referencing the scheduled pins

OUTPUT SCHEMA:
${JSON_SCHEMA}

Return ONLY the JSON object, no markdown, no explanation.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
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
