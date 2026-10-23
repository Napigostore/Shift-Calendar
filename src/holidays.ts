import { lunarNewYearEve, solarToLunar } from './lunar';
import { CustomHoliday, Lang } from './types';

export interface Holiday {
  name: string;
  off: boolean; // ngày nghỉ chính thức
  lunar: boolean;
  icon: string;
}

type Names = Record<Lang, string>;
interface FixedHoliday {
  day: number;
  month: number;
  off: boolean;
  icon: string;
  names: Names;
}

const SOLAR: FixedHoliday[] = [
  { day: 1, month: 1, off: true, icon: '🎆', names: { vi: 'Tết Dương lịch', en: "New Year's Day", zh: '元旦' } },
  { day: 14, month: 2, off: false, icon: '💝', names: { vi: 'Valentine', en: "Valentine's Day", zh: '情人节' } },
  { day: 8, month: 3, off: false, icon: '💐', names: { vi: 'Quốc tế Phụ nữ', en: "Women's Day", zh: '妇女节' } },
  { day: 30, month: 4, off: true, icon: '🇻🇳', names: { vi: 'Giải phóng miền Nam', en: 'Reunification Day', zh: '南方解放日' } },
  { day: 1, month: 5, off: true, icon: '🛠️', names: { vi: 'Quốc tế Lao động', en: 'Labour Day', zh: '劳动节' } },
  { day: 1, month: 6, off: false, icon: '🎈', names: { vi: 'Quốc tế Thiếu nhi', en: "Children's Day", zh: '儿童节' } },
  { day: 2, month: 9, off: true, icon: '🇻🇳', names: { vi: 'Quốc khánh', en: 'National Day', zh: '国庆节' } },
  { day: 1, month: 9, off: true, icon: '🇻🇳', names: { vi: 'Nghỉ Quốc khánh', en: 'National Day holiday', zh: '国庆假期' } },
  { day: 20, month: 10, off: false, icon: '🌹', names: { vi: 'Phụ nữ Việt Nam', en: "Vietnamese Women's Day", zh: '越南妇女节' } },
  { day: 20, month: 11, off: false, icon: '📚', names: { vi: 'Nhà giáo Việt Nam', en: "Teachers' Day", zh: '教师节' } },
  { day: 24, month: 12, off: false, icon: '🎅', names: { vi: 'Đêm Noel', en: 'Christmas Eve', zh: '平安夜' } },
  { day: 25, month: 12, off: false, icon: '🎄', names: { vi: 'Giáng sinh', en: 'Christmas', zh: '圣诞节' } },
];

const LUNAR: FixedHoliday[] = [
  { day: 1, month: 1, off: true, icon: '🧧', names: { vi: 'Mùng 1 Tết', en: 'Lunar New Year', zh: '春节' } },
  { day: 2, month: 1, off: true, icon: '🧧', names: { vi: 'Mùng 2 Tết', en: 'Lunar New Year (2)', zh: '春节初二' } },
  { day: 3, month: 1, off: true, icon: '🧧', names: { vi: 'Mùng 3 Tết', en: 'Lunar New Year (3)', zh: '春节初三' } },
  { day: 4, month: 1, off: true, icon: '🧧', names: { vi: 'Mùng 4 Tết', en: 'Lunar New Year (4)', zh: '春节初四' } },
  { day: 15, month: 1, off: false, icon: '🌕', names: { vi: 'Rằm tháng Giêng', en: 'Lantern Festival', zh: '元宵节' } },
  { day: 10, month: 3, off: true, icon: '🙏', names: { vi: 'Giỗ Tổ Hùng Vương', en: 'Hung Kings Day', zh: '雄王祭' } },
  { day: 15, month: 4, off: false, icon: '🪷', names: { vi: 'Lễ Phật Đản', en: "Buddha's Birthday", zh: '佛诞' } },
  { day: 5, month: 5, off: false, icon: '🐉', names: { vi: 'Tết Đoan Ngọ', en: 'Dragon Boat Festival', zh: '端午节' } },
  { day: 15, month: 7, off: false, icon: '🌹', names: { vi: 'Lễ Vu Lan', en: 'Ghost Festival', zh: '中元节' } },
  { day: 15, month: 8, off: false, icon: '🏮', names: { vi: 'Tết Trung thu', en: 'Mid-Autumn Festival', zh: '中秋节' } },
  { day: 23, month: 12, off: false, icon: '🐟', names: { vi: 'Ông Công Ông Táo', en: 'Kitchen Gods Day', zh: '小年' } },
];

/** Trả về danh sách ngày lễ của một ngày dương lịch. */
export function getHolidays(
  d: number,
  m: number,
  y: number,
  lang: Lang,
  custom: CustomHoliday[],
  includeDefault: boolean,
  fallbackIcon = '🎉',
): Holiday[] {
  const out: Holiday[] = [];
  const l = solarToLunar(d, m, y);
  if (includeDefault) {
    for (const h of SOLAR) if (h.day === d && h.month === m) out.push({ name: h.names[lang], off: h.off, lunar: false, icon: h.icon });
    if (!l.leap) {
      for (const h of LUNAR) if (h.day === l.day && h.month === l.month) out.push({ name: h.names[lang], off: h.off, lunar: true, icon: h.icon });
    }
    if (l.month === 12 && l.day >= 29) {
      const [ed, em, ey] = lunarNewYearEve(l.year);
      if (ed === d && em === m && ey === y) {
        out.push({ name: { vi: 'Giao thừa', en: "New Year's Eve (Lunar)", zh: '除夕' }[lang], off: true, lunar: true, icon: '🎇' });
      }
    }
  }
  for (const c of custom) {
    const match = c.lunar ? !l.leap && c.day === l.day && c.month === l.month : c.day === d && c.month === m;
    if (match) out.push({ name: c.name, off: c.off, lunar: c.lunar, icon: c.icon || fallbackIcon });
  }
  return out;
}
