// Mua gói PRO qua RevenueCat. Chưa có API key → app chạy ở chế độ miễn phí, màn hình mua chỉ để xem trước.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { REVENUECAT } from '../config';

const CACHE_KEY = 'shiftcalendar:pro';

export type PlanType = 'monthly' | 'yearly' | 'lifetime';

export interface Plan {
  type: PlanType;
  price: string;
  pkg?: PurchasesPackage;
}

// Giá hiển thị khi chưa lấy được giá thật từ cửa hàng
export const FALLBACK_PRICES: Record<PlanType, string> = {
  monthly: '29.000đ',
  yearly: '199.000đ',
  lifetime: '399.000đ',
};

const apiKey = () => (Platform.OS === 'ios' ? REVENUECAT.iosApiKey : Platform.OS === 'android' ? REVENUECAT.androidApiKey : '');
export const purchasesConfigured = () => !!apiKey();

type PurchasesModule = typeof import('react-native-purchases').default;
let mod: PurchasesModule | null = null;

async function sdk(): Promise<PurchasesModule | null> {
  if (!purchasesConfigured()) return null;
  if (mod) return mod;
  try {
    mod = (await import('react-native-purchases')).default;
    return mod;
  } catch {
    return null;
  }
}

const hasPro = (info: CustomerInfo) => !!info.entitlements.active[REVENUECAT.entitlement];

export async function cachedPro(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CACHE_KEY)) === '1';
  } catch {
    return false;
  }
}

async function savePro(v: boolean) {
  await AsyncStorage.setItem(CACHE_KEY, v ? '1' : '0').catch(() => {});
}

/** Khởi tạo SDK, trả về trạng thái PRO hiện tại và lắng nghe thay đổi. */
export async function initPurchases(onChange: (pro: boolean) => void): Promise<void> {
  const P = await sdk();
  if (!P) return;
  P.configure({ apiKey: apiKey() });
  P.addCustomerInfoUpdateListener((info) => {
    const pro = hasPro(info);
    savePro(pro);
    onChange(pro);
  });
  const info = await P.getCustomerInfo();
  const pro = hasPro(info);
  await savePro(pro);
  onChange(pro);
}

export async function getPlans(): Promise<Plan[]> {
  const fallback: Plan[] = (['yearly', 'monthly', 'lifetime'] as PlanType[]).map((type) => ({ type, price: FALLBACK_PRICES[type] }));
  const P = await sdk();
  if (!P) return fallback;
  try {
    const offerings = await P.getOfferings();
    const pkgs = offerings.current?.availablePackages ?? [];
    const pick = (t: string) => pkgs.find((p) => p.packageType === t);
    const map: [PlanType, string][] = [
      ['yearly', 'ANNUAL'],
      ['monthly', 'MONTHLY'],
      ['lifetime', 'LIFETIME'],
    ];
    const plans = map
      .map(([type, pt]) => {
        const pkg = pick(pt);
        return pkg ? { type, price: pkg.product.priceString, pkg } : null;
      })
      .filter((x): x is { type: PlanType; price: string; pkg: PurchasesPackage } => !!x);
    return plans.length ? plans : fallback;
  } catch {
    return fallback;
  }
}

/** Trả về true nếu mua thành công; false nếu người dùng huỷ. */
export async function purchase(plan: Plan): Promise<boolean> {
  const P = await sdk();
  if (!P || !plan.pkg) throw new Error('NOT_CONFIGURED');
  try {
    const { customerInfo } = await P.purchasePackage(plan.pkg);
    const pro = hasPro(customerInfo);
    await savePro(pro);
    return pro;
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return false;
    throw e;
  }
}

export async function restore(): Promise<boolean> {
  const P = await sdk();
  if (!P) throw new Error('NOT_CONFIGURED');
  const info = await P.restorePurchases();
  const pro = hasPro(info);
  await savePro(pro);
  return pro;
}

/** Chỉ dùng khi phát triển (__DEV__) để thử giao diện PRO. */
export async function devSetPro(v: boolean) {
  await savePro(v);
}
