const PLACES: Record<string, { lat: number; lon: number; name: string }> = {
  harare: { lat: -17.8252, lon: 31.0335, name: 'Harare' },
  bulawayo: { lat: -20.1325, lon: 28.6265, name: 'Bulawayo' },
  mutare: { lat: -18.9707, lon: 32.6709, name: 'Mutare' },
  nairobi: { lat: -1.2921, lon: 36.8219, name: 'Nairobi' },
  johannesburg: { lat: -26.2041, lon: 28.0473, name: 'Johannesburg' },
};

const CODES: Record<number, string> = {
  0: 'clear',
  1: 'mainly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'foggy',
  51: 'drizzling',
  61: 'rainy',
  71: 'snowy',
  80: 'showery',
  95: 'stormy',
};

export function extractPlace(text: string) {
  const lower = text.toLowerCase();
  for (const key of Object.keys(PLACES)) {
    if (lower.includes(key)) return PLACES[key].name;
  }
  return 'Harare';
}

export function wantsTomorrow(text: string) {
  return /\btomorrow\b|mangwana|ngomuso/i.test(text);
}

export async function fetchWeather(placeName: string, tomorrow = false): Promise<string> {
  const place =
    Object.values(PLACES).find((item) => item.name.toLowerCase() === placeName.toLowerCase()) ??
    PLACES.harare;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Africa%2FHarare`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('weather unavailable');
    const data = (await response.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
      daily?: { weather_code?: number[]; temperature_2m_max?: number[]; temperature_2m_min?: number[] };
    };
    if (tomorrow) {
      const code = data.daily?.weather_code?.[1] ?? data.daily?.weather_code?.[0] ?? 1;
      const max = data.daily?.temperature_2m_max?.[1];
      const min = data.daily?.temperature_2m_min?.[1];
      const sky = CODES[code] ?? 'fair';
      if (max != null && min != null) {
        return `Tomorrow in ${place.name} looks ${sky}, from ${Math.round(min)} to ${Math.round(max)} degrees.`;
      }
      return `Tomorrow in ${place.name} looks ${sky}.`;
    }
    const temp = data.current?.temperature_2m;
    const sky = CODES[data.current?.weather_code ?? 1] ?? 'fair';
    if (temp == null) return `It's ${sky} in ${place.name} right now.`;
    return `It's currently ${sky} and about ${Math.round(temp)} degrees in ${place.name}.`;
  } catch {
    return "It looks like I can't reach the weather service right now.";
  } finally {
    clearTimeout(timer);
  }
}
