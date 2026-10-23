// Lịch vạn niên: can chi ngày/tháng, giờ hoàng đạo, ngày hoàng đạo/hắc đạo, tiết khí.
import { CAN, CHI, jdFromDate, solarTermIndex, solarToLunar } from './lunar';
import { Lang } from './types';

const CHI_ZH = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const CAN_ZH = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const CHI_EN = ['Rat', 'Ox', 'Tiger', 'Cat', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
const CHI_ICON = ['🐀', '🐃', '🐅', '🐈', '🐉', '🐍', '🐎', '🐐', '🐒', '🐓', '🐕', '🐖'];

// Giờ hoàng đạo theo chi của ngày (Tý/Ngọ, Sửu/Mùi, ...): 1 = giờ tốt
const GIO_HD = ['110100101100', '001101001011', '110011010010', '101100110100', '001011001101', '010010110011'];

// 12 vị thần trực ngày; vị trí 0,1,4,5,7,10 là hoàng đạo
const GODS: Record<Lang, string[]> = {
  vi: ['Thanh Long', 'Minh Đường', 'Thiên Hình', 'Chu Tước', 'Kim Quỹ', 'Kim Đường', 'Bạch Hổ', 'Ngọc Đường', 'Thiên Lao', 'Huyền Vũ', 'Tư Mệnh', 'Câu Trận'],
  en: ['Azure Dragon', 'Bright Hall', 'Heavenly Punishment', 'Vermilion Bird', 'Golden Lock', 'Precious Light', 'White Tiger', 'Jade Hall', 'Heavenly Prison', 'Black Tortoise', 'Life Governor', 'Hook Array'],
  zh: ['青龙', '明堂', '天刑', '朱雀', '金匮', '天德', '白虎', '玉堂', '天牢', '玄武', '司命', '勾陈'],
};
const GOOD_GODS = new Set([0, 1, 4, 5, 7, 10]);

const TERMS: Record<Lang, string[]> = {
  vi: ['Xuân phân', 'Thanh minh', 'Cốc vũ', 'Lập hạ', 'Tiểu mãn', 'Mang chủng', 'Hạ chí', 'Tiểu thử', 'Đại thử', 'Lập thu', 'Xử thử', 'Bạch lộ', 'Thu phân', 'Hàn lộ', 'Sương giáng', 'Lập đông', 'Tiểu tuyết', 'Đại tuyết', 'Đông chí', 'Tiểu hàn', 'Đại hàn', 'Lập xuân', 'Vũ thủy', 'Kinh trập'],
  zh: ['春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰'],
  en: ['Spring Equinox', 'Clear & Bright', 'Grain Rain', 'Start of Summer', 'Grain Buds', 'Grain in Ear', 'Summer Solstice', 'Minor Heat', 'Major Heat', 'Start of Autumn', 'End of Heat', 'White Dew', 'Autumn Equinox', 'Cold Dew', 'Frost Descent', 'Start of Winter', 'Minor Snow', 'Major Snow', 'Winter Solstice', 'Minor Cold', 'Major Cold', 'Start of Spring', 'Rain Water', 'Awakening of Insects'],
};

const canChi = (can: number, chi: number, lang: Lang) =>
  lang === 'zh' ? `${CAN_ZH[can]}${CHI_ZH[chi]}` : lang === 'en' ? `${CAN[can]} ${CHI[chi]} (${CHI_EN[chi]})` : `${CAN[can]} ${CHI[chi]}`;

export interface HourInfo {
  chi: string;
  icon: string;
  range: string; // "23–01"
}

export interface DayAlmanac {
  dayName: string; // can chi ngày
  monthName: string;
  god: string;
  good: boolean; // ngày hoàng đạo
  goodHours: HourInfo[];
  term: string; // tiết khí hiện tại
  termStarts: boolean; // hôm nay bắt đầu tiết mới
}

export function almanac(d: number, m: number, y: number, lang: Lang): DayAlmanac {
  const jd = jdFromDate(d, m, y);
  const l = solarToLunar(d, m, y);
  const dayCan = (jd + 9) % 10;
  const dayChi = (jd + 1) % 12;
  const monthChi = (l.month + 1) % 12;
  const monthCan = (l.year * 12 + l.month + 3) % 10;

  const startChi = [0, 2, 4, 6, 8, 10][(l.month - 1) % 6]; // chi của ngày Thanh Long theo tháng âm
  const godIdx = (dayChi - startChi + 12) % 12;

  const bits = GIO_HD[dayChi % 6];
  const goodHours: HourInfo[] = [];
  for (let i = 0; i < 12; i++) {
    if (bits[i] !== '1') continue;
    const from = (i * 2 + 23) % 24;
    const to = (i * 2 + 1) % 24;
    goodHours.push({
      chi: lang === 'zh' ? CHI_ZH[i] : lang === 'en' ? CHI_EN[i] : CHI[i],
      icon: CHI_ICON[i],
      range: `${String(from).padStart(2, '0')}–${String(to).padStart(2, '0')}`,
    });
  }

  // Ngày chứa thời điểm chuyển tiết = ngày bắt đầu tiết (tính lúc 24h)
  const term = solarTermIndex(jd + 1);
  return {
    dayName: canChi(dayCan, dayChi, lang),
    monthName: canChi(monthCan, monthChi, lang),
    god: GODS[lang][godIdx],
    good: GOOD_GODS.has(godIdx),
    goodHours,
    term: TERMS[lang][term],
    termStarts: solarTermIndex(jd) !== term,
  };
}
