// Phông chữ kiểu Apple trên mọi nền tảng:
// - iOS / iPadOS / Mac: San Francisco của hệ thống (không cần khai báo).
// - Android: Inter — phông mã nguồn mở gần SF Pro nhất (SF Pro chỉ được phép dùng trên thiết bị Apple).
// - Web: ưu tiên SF qua -apple-system, rồi Inter.
import { Platform, StyleSheet, TextStyle } from 'react-native';

export const INTER_FAMILIES: Record<string, string> = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
};

const WEB_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter_400Regular", Inter, "Helvetica Neue", "Segoe UI", Roboto, sans-serif';

function weightKey(w: TextStyle['fontWeight']): string {
  if (w === 'bold') return '700';
  if (w === 'normal' || w === undefined) return '400';
  const n = Number(w);
  if (n >= 700) return '700';
  if (n >= 600) return '600';
  if (n >= 500) return '500';
  return '400';
}

/** Bổ sung fontFamily cho style (Android/web). iOS giữ nguyên để dùng SF của hệ thống. */
export function appleFont<T>(style: T): T {
  if (Platform.OS === 'ios') return style;
  const flat = (StyleSheet.flatten(style as never) ?? {}) as TextStyle;
  if (flat.fontFamily) return style;
  if (Platform.OS === 'android') {
    // Android không tự làm đậm phông tuỳ chỉnh: chọn đúng file theo độ đậm và bỏ fontWeight
    return { ...flat, fontFamily: INTER_FAMILIES[weightKey(flat.fontWeight)], fontWeight: undefined } as T;
  }
  return { ...flat, fontFamily: WEB_STACK } as T;
}
