import { Accent } from './types';

// Bảng màu theo iOS Human Interface Guidelines (system colors), giữ chất "xanh điện + cam cảnh báo".
export interface Palette {
  dark: boolean;
  bg: string; // nền nhóm (systemGroupedBackground)
  card: string; // secondarySystemGroupedBackground
  card2: string; // tertiary
  fill: string; // nền segmented / ô nhập
  separator: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  orange: string;
  orangeSoft: string;
  red: string;
  green: string;
  blue: string;
  indigo: string;
  purple: string;
  teal: string;
  yellow: string;
  pink: string;
  gray: string;
  weekend: string;
  barBg: string; // nền tab bar (dùng khi không có blur)
}

const ACCENT_DARK: Record<Accent, string> = { electric: '#0AB4FF', orange: '#FF9F0A', green: '#30D158', purple: '#BF5AF2' };
const ACCENT_LIGHT: Record<Accent, string> = { electric: '#007AFF', orange: '#F57C00', green: '#28A745', purple: '#AF52DE' };

export function makePalette(dark: boolean, accent: Accent): Palette {
  if (dark) {
    const a = ACCENT_DARK[accent];
    return {
      dark,
      bg: '#000000',
      card: '#1C1C1E',
      card2: '#2C2C2E',
      fill: 'rgba(118,118,128,0.24)',
      separator: 'rgba(84,84,88,0.65)',
      text: '#FFFFFF',
      text2: 'rgba(235,235,245,0.6)',
      text3: 'rgba(235,235,245,0.3)',
      accent: a,
      accentSoft: a + '26',
      onAccent: '#FFFFFF',
      orange: '#FF9F0A',
      orangeSoft: 'rgba(255,159,10,0.16)',
      red: '#FF453A',
      green: '#30D158',
      blue: '#0A84FF',
      indigo: '#5E5CE6',
      purple: '#BF5AF2',
      teal: '#64D2FF',
      yellow: '#FFD60A',
      pink: '#FF375F',
      gray: '#8E8E93',
      weekend: '#FF9F0A',
      barBg: 'rgba(22,22,24,0.94)',
    };
  }
  const a = ACCENT_LIGHT[accent];
  return {
    dark,
    bg: '#F2F2F7',
    card: '#FFFFFF',
    card2: '#F2F2F7',
    fill: 'rgba(118,118,128,0.12)',
    separator: 'rgba(60,60,67,0.18)',
    text: '#000000',
    text2: 'rgba(60,60,67,0.6)',
    text3: 'rgba(60,60,67,0.3)',
    accent: a,
    accentSoft: a + '1F',
    onAccent: '#FFFFFF',
    orange: '#FF9500',
    orangeSoft: 'rgba(255,149,0,0.12)',
    red: '#FF3B30',
    green: '#34C759',
    blue: '#007AFF',
    indigo: '#5856D6',
    purple: '#AF52DE',
    teal: '#32ADE6',
    yellow: '#FFCC00',
    pink: '#FF2D55',
    gray: '#8E8E93',
    weekend: '#FF9500',
    barBg: 'rgba(249,249,249,0.94)',
  };
}

/** Chữ đen hay trắng tuỳ độ sáng của màu nền. */
export function readableOn(hex: string): string {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#1C1C1E' : '#FFFFFF';
}

export interface ShiftCellLook {
  bg: string | null; // nền cả ô lịch
  night: boolean; // nền tối → chữ sáng
}

/** Màu nền ô lịch theo ca: ca ngày sáng màu, ca đêm nền xanh đêm đậm, nghỉ thì để trống. */
export function shiftCellLook(kind: string, color: string, dark: boolean): ShiftCellLook {
  if (kind === 'night') return { bg: dark ? '#101C4A' : '#24306A', night: true };
  if (kind === 'off') return { bg: null, night: false };
  return { bg: color + (dark ? '3A' : '38'), night: false };
}

export const SHIFT_COLORS = [
  '#0A84FF', '#0AB4FF', '#64D2FF', '#5E5CE6', '#BF5AF2', '#FF375F',
  '#FF453A', '#FF9F0A', '#FFD60A', '#30D158', '#00C7BE', '#8E8E93',
];

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 22 };
