// Đồng bộ Firebase qua REST API (Auth + Realtime Database) — không cần native SDK,
// chạy được cả trong Expo Go.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE } from '../config';
import { AppData } from '../types';

const SESSION_KEY = 'shiftcalendar:firebase-session';

interface Session {
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export const isConfigured = () => !!FIREBASE.apiKey && !!FIREBASE.databaseURL;

async function authCall(endpoint: string, body: object) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${FIREBASE.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? 'AUTH_ERROR');
  return json;
}

async function store(json: { localId: string; email: string; idToken: string; refreshToken: string; expiresIn: string }) {
  const s: Session = {
    uid: json.localId,
    email: json.email,
    idToken: json.idToken,
    refreshToken: json.refreshToken,
    expiresAt: Date.now() + Number(json.expiresIn) * 1000 - 60000,
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
  return s;
}

export async function signIn(email: string, password: string) {
  return store(await authCall('signInWithPassword', { email, password, returnSecureToken: true }));
}

export async function signUp(email: string, password: string) {
  return store(await authCall('signUp', { email, password, returnSecureToken: true }));
}

/** Đổi id_token của Apple/Google lấy phiên Firebase. */
export async function signInWithIdp(providerId: 'apple.com' | 'google.com', idToken: string, rawNonce?: string) {
  const postBody = `id_token=${encodeURIComponent(idToken)}&providerId=${providerId}${rawNonce ? `&nonce=${encodeURIComponent(rawNonce)}` : ''}`;
  const json = await authCall('signInWithIdp', { postBody, requestUri: 'http://localhost', returnSecureToken: true, returnIdpCredential: true });
  return store({ ...json, email: json.email ?? json.displayName ?? providerId });
}

export async function signInWithApple() {
  const Apple = await import('expo-apple-authentication');
  const Crypto = await import('expo-crypto');
  const rawNonce = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  const cred = await Apple.signInAsync({
    requestedScopes: [Apple.AppleAuthenticationScope.EMAIL, Apple.AppleAuthenticationScope.FULL_NAME],
    nonce: hashed,
  });
  if (!cred.identityToken) throw new Error('NO_IDENTITY_TOKEN');
  return signInWithIdp('apple.com', cred.identityToken, rawNonce);
}

export async function appleAvailable() {
  try {
    const Apple = await import('expo-apple-authentication');
    return await Apple.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signOut() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

/** Xoá dữ liệu cloud và tài khoản Firebase (bắt buộc theo App Store Guideline 5.1.1(v)). */
export async function deleteAccount() {
  const s = await getSession();
  if (!s) throw new Error('NOT_SIGNED_IN');
  const res = await fetch(`${FIREBASE.databaseURL.replace(/\/$/, '')}/users/${s.uid}.json?auth=${s.idToken}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  await authCall('delete', { idToken: s.idToken });
  await signOut();
}

export async function getSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const s: Session = JSON.parse(raw);
  if (Date.now() < s.expiresAt) return s;
  const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(s.refreshToken)}`,
  });
  if (!res.ok) return null;
  const j = await res.json();
  const next: Session = {
    ...s,
    idToken: j.id_token,
    refreshToken: j.refresh_token,
    expiresAt: Date.now() + Number(j.expires_in) * 1000 - 60000,
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

const userUrl = (s: Session, path: string) =>
  `${FIREBASE.databaseURL.replace(/\/$/, '')}/users/${s.uid}/${path}.json?auth=${s.idToken}`;

export async function backup(data: AppData): Promise<number> {
  const s = await getSession();
  if (!s) throw new Error('NOT_SIGNED_IN');
  const at = Date.now();
  const res = await fetch(userUrl(s, 'backup'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ at, data: JSON.stringify(data) }),
  });
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return at;
}

export async function restore(): Promise<{ at: number; data: AppData } | null> {
  const s = await getSession();
  if (!s) throw new Error('NOT_SIGNED_IN');
  const res = await fetch(userUrl(s, 'backup'));
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  const j = await res.json();
  if (!j?.data) return null;
  return { at: j.at, data: JSON.parse(j.data) };
}
