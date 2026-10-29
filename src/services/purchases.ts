// Gói PRO qua StoreKit (expo-iap), giống CaloCare: gói Tháng và gói Năm tự gia hạn trong nhóm "Shift Calendar PRO".
// Chỉ bán trên thiết bị Apple; Android chưa có gói trên Google Play nên mọi tính năng mở miễn phí.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CACHE_KEY = 'shiftcalendar:pro';

export type PlanType = 'monthly' | 'yearly';

export const SKUS: Record<PlanType, string> = {
  monthly: 'com.napigo.shiftcalendar.pro.monthly',
  yearly: 'com.napigo.shiftcalendar.pro.yearly',
};
const ALL_SKUS = Object.values(SKUS);

export interface Plan {
  type: PlanType;
  price: string;
  sku: string;
}

// Giá hiển thị khi chưa lấy được giá thật từ App Store (bằng giá CaloCare)
export const FALLBACK_PRICES: Record<PlanType, string> = {
  monthly: '19.000đ',
  yearly: '199.000đ',
};

export const purchasesConfigured = () => Platform.OS === 'ios';

type IapModule = typeof import('expo-iap');
let mod: IapModule | null = null;
let pending: { sku: string; resolve: (ok: boolean) => void; reject: (e: unknown) => void } | null = null;

async function sdk(): Promise<IapModule | null> {
  if (!purchasesConfigured()) return null;
  if (mod) return mod;
  try {
    const m = await import('expo-iap');
    await m.initConnection();
    mod = m;
    return m;
  } catch {
    return null;
  }
}

// Trạng thái PRO lưu trong Keychain / Keystore (không nằm trong tệp dữ liệu thường, khó sửa tay trên máy đã jailbreak / root),
// kèm thời điểm Apple xác nhận lần cuối. Ngoại tuyến vẫn dùng được tối đa 7 ngày, sau đó phải xác nhận lại với App Store.
const SECURE_KEY = 'shiftcalendar.pro';
const OFFLINE_GRACE = 7 * 24 * 3600 * 1000;

async function readStore(): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(CACHE_KEY);
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(SECURE_KEY);
}

async function writeStore(v: string) {
  if (Platform.OS === 'web') return AsyncStorage.setItem(CACHE_KEY, v);
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(SECURE_KEY, v, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
  AsyncStorage.removeItem(CACHE_KEY).catch(() => {}); // bỏ bản lưu cũ dạng thường
}

export async function cachedPro(): Promise<boolean> {
  try {
    const raw = await readStore();
    if (!raw) return false;
    const v = JSON.parse(raw) as { pro?: unknown; checked?: unknown };
    return v.pro === true && typeof v.checked === 'number' && Date.now() - v.checked < OFFLINE_GRACE && v.checked <= Date.now() + 60000;
  } catch {
    return false;
  }
}

async function savePro(v: boolean) {
  await writeStore(JSON.stringify({ pro: v, checked: Date.now() })).catch(() => {});
}

async function activePro(I: IapModule): Promise<boolean> {
  const subs = await I.getActiveSubscriptions(ALL_SKUS);
  return subs.some((s) => s.isActive && ALL_SKUS.includes(s.productId));
}

/** Kết nối StoreKit, lắng nghe giao dịch và báo trạng thái PRO hiện tại. */
export async function initPurchases(onChange: (pro: boolean) => void): Promise<void> {
  const I = await sdk();
  if (!I) return;
  I.purchaseUpdatedListener(async (p) => {
    if (!ALL_SKUS.includes(p.productId)) return;
    try {
      await I.finishTransaction({ purchase: p, isConsumable: false });
    } catch {
      // đã hoàn tất trước đó
    }
    await savePro(true);
    onChange(true);
    if (pending && pending.sku === p.productId) {
      pending.resolve(true);
      pending = null;
    }
  });
  I.purchaseErrorListener((e) => {
    if (!pending) return;
    const code = String((e as { code?: string }).code ?? '');
    if (/cancel/i.test(code) || /cancel/i.test(String((e as { message?: string }).message ?? ''))) pending.resolve(false);
    else pending.reject(e);
    pending = null;
  });
  const pro = await activePro(I);
  await savePro(pro);
  onChange(pro);
}

export async function getPlans(): Promise<Plan[]> {
  const fallback: Plan[] = (['yearly', 'monthly'] as PlanType[]).map((type) => ({ type, price: FALLBACK_PRICES[type], sku: SKUS[type] }));
  const I = await sdk();
  if (!I) return fallback;
  try {
    const products = (await I.fetchProducts({ skus: ALL_SKUS, type: 'subs' })) ?? [];
    return fallback.map((p) => {
      const found = products.find((x) => x.id === p.sku);
      return found ? { ...p, price: found.displayPrice } : p;
    });
  } catch {
    return fallback;
  }
}

/** Trả về true khi mua thành công, false khi người dùng huỷ. */
export async function purchase(plan: Plan): Promise<boolean> {
  const I = await sdk();
  if (!I) throw new Error('NOT_AVAILABLE');
  const done = new Promise<boolean>((resolve, reject) => {
    pending = { sku: plan.sku, resolve, reject };
  });
  await I.requestPurchase({ request: { apple: { sku: plan.sku } }, type: 'subs' });
  return done;
}

export async function restore(): Promise<boolean> {
  const I = await sdk();
  if (!I) throw new Error('NOT_AVAILABLE');
  await I.restorePurchases();
  const pro = await activePro(I);
  await savePro(pro);
  return pro;
}

/** Chỉ dùng khi phát triển (__DEV__) để thử giao diện PRO. */
export async function devSetPro(v: boolean) {
  if (!__DEV__) return; // bản phát hành: chỉ App Store mới cấp PRO
  await savePro(v);
}
