import { Lang } from './types';

export interface StickerGroup {
  key: string;
  names: Record<Lang, string>;
  icons: string[];
}

// Sticker gắn lên ngày: lễ hội, kỳ nghỉ, công việc, sức khoẻ, gia đình...
export const STICKERS: StickerGroup[] = [
  {
    key: 'festival',
    names: { vi: 'Lễ hội', en: 'Festive', zh: '节日' },
    icons: ['🎉', '🎊', '🧧', '🏮', '🎆', '🎇', '🐉', '🌸', '🎄', '🎅', '🤶', '⛄', '🎁', '🔔', '🦌', '🎃', '💝', '💐', '🎂', '🥮', '🇻🇳', '⭐', '🕯️', '🙏'],
  },
  {
    key: 'vacation',
    names: { vi: 'Kỳ nghỉ', en: 'Vacation', zh: '度假' },
    icons: ['🏖️', '🏝️', '🌴', '🥥', '☀️', '🌊', '⛱️', '🐚', '🍹', '🕶️', '🩱', '🤿', '🏄', '⛵', '✈️', '🧳', '🏕️', '⛰️', '🗻', '🚗', '🏨', '📸', '🗺️', '🎡'],
  },
  {
    key: 'work',
    names: { vi: 'Công việc', en: 'Work', zh: '工作' },
    icons: ['⚡', '🏭', '🛢️', '🔧', '🛠️', '⚙️', '🦺', '👷', '🧯', '⚠️', '🚨', '📋', '✅', '📦', '🚚', '💼', '📈', '🧪', '🔥', '⛽', '🗓️', '⏰', '💰', '🏆'],
  },
  {
    key: 'health',
    names: { vi: 'Sức khoẻ', en: 'Health', zh: '健康' },
    icons: ['😴', '🤒', '🤕', '💊', '🏥', '🩺', '💉', '🧘', '🏃', '🏋️', '🚴', '⚽', '🏸', '🥗', '💧', '❤️‍🩹', '😊', '😎', '😤', '🥱', '😭', '🥳', '💪', '🧠'],
  },
  {
    key: 'life',
    names: { vi: 'Gia đình', en: 'Life', zh: '生活' },
    icons: ['❤️', '💍', '👶', '🍼', '🏠', '🎓', '📚', '🐶', '🐱', '👨‍👩‍👧', '💒', '🛒', '🍜', '🍲', '🍻', '☕', '🍰', '🎮', '🎬', '🎤', '🎵', '💇', '🚿', '🧹'],
  },
  {
    key: 'weather',
    names: { vi: 'Thời tiết', en: 'Weather', zh: '天气' },
    icons: ['☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌪️', '🌀', '🌈', '❄️', '🌫️', '🌙', '⭐', '🌕', '🌑', '🔆', '🥵', '🥶', '☂️', '🌡️', '💨'],
  },
];
