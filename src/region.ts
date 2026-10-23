import { getLocales } from 'expo-localization';
import { Lang } from './types';

export interface Region {
  code: string;
  flag: string;
  name: string;
  lunar: boolean; // quốc gia vẫn dùng âm lịch (Tết, rằm…)
  holidays: boolean; // có bộ ngày lễ mặc định (hiện chỉ có VN)
}

// Âm lịch chỉ hiện ở các nước/vùng còn dùng lịch âm trong đời sống.
export const REGIONS: Region[] = [
  { code: 'VN', flag: '🇻🇳', name: 'Việt Nam', lunar: true, holidays: true },
  { code: 'CN', flag: '🇨🇳', name: '中国', lunar: true, holidays: false },
  { code: 'TW', flag: '🇹🇼', name: '台灣', lunar: true, holidays: false },
  { code: 'HK', flag: '🇭🇰', name: '香港', lunar: true, holidays: false },
  { code: 'MO', flag: '🇲🇴', name: '澳門', lunar: true, holidays: false },
  { code: 'KR', flag: '🇰🇷', name: '대한민국', lunar: true, holidays: false },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore', lunar: true, holidays: false },
  { code: 'MY', flag: '🇲🇾', name: 'Malaysia', lunar: true, holidays: false },
  { code: 'JP', flag: '🇯🇵', name: '日本', lunar: false, holidays: false },
  { code: 'TH', flag: '🇹🇭', name: 'ประเทศไทย', lunar: false, holidays: false },
  { code: 'KH', flag: '🇰🇭', name: 'Cambodia', lunar: false, holidays: false },
  { code: 'LA', flag: '🇱🇦', name: 'Laos', lunar: false, holidays: false },
  { code: 'PH', flag: '🇵🇭', name: 'Philippines', lunar: false, holidays: false },
  { code: 'ID', flag: '🇮🇩', name: 'Indonesia', lunar: false, holidays: false },
  { code: 'IN', flag: '🇮🇳', name: 'India', lunar: false, holidays: false },
  { code: 'AU', flag: '🇦🇺', name: 'Australia', lunar: false, holidays: false },
  { code: 'US', flag: '🇺🇸', name: 'United States', lunar: false, holidays: false },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom', lunar: false, holidays: false },
  { code: 'DE', flag: '🇩🇪', name: 'Deutschland', lunar: false, holidays: false },
  { code: 'FR', flag: '🇫🇷', name: 'France', lunar: false, holidays: false },
  { code: 'OTHER', flag: '🌍', name: 'Other / Khác', lunar: false, holidays: false },
];

export const regionOf = (code: string) => REGIONS.find((r) => r.code === code) ?? REGIONS[REGIONS.length - 1];

export const isLunarRegion = (code: string) => regionOf(code).lunar;

/** Đoán ngôn ngữ và quốc gia từ máy. */
export function detectLocale(): { lang: Lang; region: string } {
  try {
    const l = getLocales()[0];
    const code = (l?.languageCode ?? 'vi').toLowerCase();
    const lang: Lang = code === 'vi' ? 'vi' : code === 'zh' ? 'zh' : code === 'en' ? 'en' : 'en';
    const rc = (l?.regionCode ?? '').toUpperCase();
    const region = REGIONS.some((r) => r.code === rc) ? rc : lang === 'vi' ? 'VN' : lang === 'zh' ? 'CN' : 'OTHER';
    return { lang, region };
  } catch {
    return { lang: 'vi', region: 'VN' };
  }
}
