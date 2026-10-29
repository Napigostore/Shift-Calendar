// Thời tiết, thuỷ triều qua Open-Meteo (miễn phí, không cần API key) + con nước theo âm lịch.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { solarToLunar } from '../lunar';
import { Lang, WeatherSettings } from '../types';

const CACHE_KEY = 'shiftcalendar:weather-cache';
const CACHE_MS = 30 * 60 * 1000;

export interface TidePoint {
  time: string; // HH:mm
  height: number; // m
  high: boolean;
}

export interface WeatherData {
  at: number;
  place: string;
  temp: number;
  feels: number;
  humidity: number;
  code: number;
  wind: number; // km/h
  gust: number;
  uv: number;
  tMax: number;
  tMin: number;
  rainChance: number;
  stormRisk: 'none' | 'thunder' | 'strong-wind' | 'storm';
  stormDay?: string; // yyyy-MM-dd ngày có nguy cơ
  tides: TidePoint[] | null;
  wave: number | null;
}

export interface PlaceResult {
  name: string;
  detail: string;
  lat: number;
  lon: number;
}

const WMO: Record<number, [string, Record<Lang, string>]> = {
  0: ['☀️', { vi: 'Trời quang', en: 'Clear', zh: '晴' }],
  1: ['🌤️', { vi: 'Ít mây', en: 'Mostly clear', zh: '晴间少云' }],
  2: ['⛅', { vi: 'Có mây', en: 'Partly cloudy', zh: '多云' }],
  3: ['☁️', { vi: 'Nhiều mây', en: 'Overcast', zh: '阴' }],
  45: ['🌫️', { vi: 'Sương mù', en: 'Fog', zh: '雾' }],
  48: ['🌫️', { vi: 'Sương mù', en: 'Fog', zh: '雾' }],
  51: ['🌦️', { vi: 'Mưa phùn', en: 'Drizzle', zh: '毛毛雨' }],
  53: ['🌦️', { vi: 'Mưa phùn', en: 'Drizzle', zh: '毛毛雨' }],
  55: ['🌦️', { vi: 'Mưa phùn dày', en: 'Heavy drizzle', zh: '浓毛毛雨' }],
  61: ['🌧️', { vi: 'Mưa nhỏ', en: 'Light rain', zh: '小雨' }],
  63: ['🌧️', { vi: 'Mưa vừa', en: 'Rain', zh: '中雨' }],
  65: ['🌧️', { vi: 'Mưa to', en: 'Heavy rain', zh: '大雨' }],
  80: ['🌦️', { vi: 'Mưa rào', en: 'Showers', zh: '阵雨' }],
  81: ['🌧️', { vi: 'Mưa rào vừa', en: 'Showers', zh: '阵雨' }],
  82: ['⛈️', { vi: 'Mưa rào rất to', en: 'Violent showers', zh: '强阵雨' }],
  95: ['⛈️', { vi: 'Dông', en: 'Thunderstorm', zh: '雷暴' }],
  96: ['⛈️', { vi: 'Dông kèm mưa đá', en: 'Thunderstorm, hail', zh: '雷暴伴冰雹' }],
  99: ['⛈️', { vi: 'Dông mạnh, mưa đá', en: 'Severe thunderstorm', zh: '强雷暴' }],
};

export function describeWeather(code: number, lang: Lang): { icon: string; text: string } {
  const hit = WMO[code] ?? WMO[Object.keys(WMO).map(Number).filter((k) => k <= code).pop() ?? 0];
  return { icon: hit[0], text: hit[1][lang] };
}

/** Pha trăng và con nước (nước rong / nước kém) theo ngày âm. */
export function moonTide(date: Date, lang: Lang) {
  const l = solarToLunar(date.getDate(), date.getMonth() + 1, date.getFullYear());
  const d = l.day;
  const phases: [number, string, Record<Lang, string>][] = [
    [1, '🌑', { vi: 'Trăng non', en: 'New moon', zh: '新月' }],
    [4, '🌒', { vi: 'Trăng lưỡi liềm', en: 'Waxing crescent', zh: '蛾眉月' }],
    [8, '🌓', { vi: 'Thượng huyền', en: 'First quarter', zh: '上弦月' }],
    [11, '🌔', { vi: 'Trăng khuyết đầu tháng', en: 'Waxing gibbous', zh: '盈凸月' }],
    [15, '🌕', { vi: 'Trăng tròn', en: 'Full moon', zh: '满月' }],
    [18, '🌖', { vi: 'Trăng khuyết cuối tháng', en: 'Waning gibbous', zh: '亏凸月' }],
    [22, '🌗', { vi: 'Hạ huyền', en: 'Last quarter', zh: '下弦月' }],
    [26, '🌘', { vi: 'Trăng tàn', en: 'Waning crescent', zh: '残月' }],
  ];
  const phase = [...phases].reverse().find(([from]) => d >= from) ?? phases[0];
  const spring = d <= 4 || (d >= 13 && d <= 19) || d >= 28;
  return {
    lunarDay: d,
    moonIcon: phase[1],
    moonName: phase[2][lang],
    tideName: spring
      ? { vi: 'Nước rong (triều cường)', en: 'Spring tide', zh: '大潮' }[lang]
      : { vi: 'Nước kém (triều thấp)', en: 'Neap tide', zh: '小潮' }[lang],
    spring,
  };
}

export async function searchPlaces(q: string, lang: Lang): Promise<PlaceResult[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=8&language=${lang}`);
  const j = await res.json();
  return (j.results ?? []).map((r: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }) => ({
    name: r.name,
    detail: [r.admin1, r.country].filter(Boolean).join(', '),
    lat: r.latitude,
    lon: r.longitude,
  }));
}

async function resolveLocation(ws: WeatherSettings, lowPower: boolean): Promise<{ lat: number; lon: number; place: string } | null> {
  if (ws.useGps) {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.granted) {
        // Vị trí gần nhất của hệ thống là đủ cho dự báo; chỉ bật GPS khi chưa có (chế độ máy yếu: không bật)
        const last = await Location.getLastKnownPositionAsync({ maxAge: 6 * 3600 * 1000 });
        const pos = last ?? (lowPower ? null : await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
        if (!pos) throw new Error('NO_FIX');
        let place = '';
        try {
          const [g] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          place = g?.city || g?.subregion || g?.region || '';
        } catch {
          // reverse geocode không có trên web
        }
        return { lat: pos.coords.latitude, lon: pos.coords.longitude, place };
      }
    } catch {
      // không lấy được GPS → dùng vị trí đã chọn
    }
  }
  if (ws.lat != null && ws.lon != null) return { lat: ws.lat, lon: ws.lon, place: ws.place ?? '' };
  return null;
}

function tideExtremes(times: string[], heights: (number | null)[]): TidePoint[] {
  const now = Date.now();
  const out: TidePoint[] = [];
  for (let i = 1; i < heights.length - 1; i++) {
    const a = heights[i - 1], b = heights[i], c = heights[i + 1];
    if (a == null || b == null || c == null) continue;
    const t = new Date(times[i]).getTime();
    if (t < now - 3600000 || t > now + 30 * 3600000) continue;
    if (b > a && b >= c) out.push({ time: times[i].slice(11, 16), height: b, high: true });
    else if (b < a && b <= c) out.push({ time: times[i].slice(11, 16), height: b, high: false });
  }
  return out.slice(0, 4);
}

export async function getWeather(ws: WeatherSettings, force = false, lowPower = false): Promise<WeatherData | null> {
  if (!ws.enabled) return null;
  if (!force) {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: WeatherData = JSON.parse(raw);
        if (Date.now() - cached.at < CACHE_MS) return cached;
      }
    } catch {
      // bỏ qua cache hỏng
    }
  }
  const loc = await resolveLocation(ws, lowPower);
  if (!loc) return null;
  const base = `latitude=${loc.lat.toFixed(4)}&longitude=${loc.lon.toFixed(4)}&timezone=auto`;
  const fRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?${base}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,uv_index` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_gusts_10m_max,weather_code&forecast_days=3`,
  );
  if (!fRes.ok) return null;
  const f = await fRes.json();

  // Nguy cơ bão / gió mạnh trong 3 ngày tới (gió giật ≥ 62 km/h ~ cấp 8)
  let stormRisk: WeatherData['stormRisk'] = 'none';
  let stormDay: string | undefined;
  (f.daily.time as string[]).forEach((day, i) => {
    const gust = f.daily.wind_gusts_10m_max[i] ?? 0;
    const code = f.daily.weather_code[i] ?? 0;
    const level = gust >= 89 ? 'storm' : gust >= 62 ? 'strong-wind' : code >= 95 ? 'thunder' : 'none';
    const rank = { none: 0, thunder: 1, 'strong-wind': 2, storm: 3 } as const;
    if (rank[level] > rank[stormRisk]) {
      stormRisk = level;
      stormDay = day;
    }
  });

  let tides: TidePoint[] | null = null;
  let wave: number | null = null;
  if (ws.showTide) {
    try {
      const mRes = await fetch(`https://marine-api.open-meteo.com/v1/marine?${base}&hourly=sea_level_height_msl,wave_height&forecast_days=2`);
      if (mRes.ok) {
        const m = await mRes.json();
        const heights: (number | null)[] = m.hourly?.sea_level_height_msl ?? [];
        if (heights.some((h) => h != null)) {
          tides = tideExtremes(m.hourly.time, heights);
          const idx = (m.hourly.time as string[]).findIndex((x) => new Date(x).getTime() >= Date.now() - 3600000);
          wave = idx >= 0 ? m.hourly.wave_height[idx] ?? null : null;
        }
      }
    } catch {
      // vị trí trong đất liền: không có dữ liệu biển
    }
  }

  const data: WeatherData = {
    at: Date.now(),
    place: loc.place,
    temp: f.current.temperature_2m,
    feels: f.current.apparent_temperature,
    humidity: f.current.relative_humidity_2m,
    code: f.current.weather_code,
    wind: f.current.wind_speed_10m,
    gust: f.current.wind_gusts_10m,
    uv: f.current.uv_index ?? 0,
    tMax: f.daily.temperature_2m_max[0],
    tMin: f.daily.temperature_2m_min[0],
    rainChance: f.daily.precipitation_probability_max?.[0] ?? 0,
    stormRisk,
    stormDay,
    tides,
    wave,
  };
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
  return data;
}

export const toUnit = (c: number, f: boolean) => Math.round(f ? (c * 9) / 5 + 32 : c) + '°';
