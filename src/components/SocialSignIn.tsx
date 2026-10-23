import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GOOGLE } from '../config';
import * as Cloud from '../services/cloud';
import { useStore } from '../store';
import { haptic } from './ui';

WebBrowser.maybeCompleteAuthSession();

const googleConfigured = () =>
  !!(Platform.OS === 'ios' ? GOOGLE.iosClientId : Platform.OS === 'android' ? GOOGLE.androidClientId : GOOGLE.webClientId);

type Done = (email: string, provider: 'apple' | 'google') => void;

/** Nút "Đăng nhập bằng Apple" + "Đăng nhập bằng Google" theo đúng hướng dẫn thương hiệu. */
export function SocialSignIn({ onSignedIn }: { onSignedIn: Done }) {
  const { t, c } = useStore();
  const [apple, setApple] = useState(false);
  useEffect(() => {
    Cloud.appleAvailable().then(setApple);
  }, []);

  return (
    <View style={{ gap: 10 }}>
      {apple && (
        <Pressable
          onPress={async () => {
            haptic('light');
            try {
              const s = await Cloud.signInWithApple();
              onSignedIn(s.email, 'apple');
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              if (!/cancel/i.test(msg)) Alert.alert(t.error, msg);
            }
          }}
          style={({ pressed }) => [styles.btn, { backgroundColor: c.dark ? '#FFFFFF' : '#000000', opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="logo-apple" size={20} color={c.dark ? '#000' : '#fff'} />
          <Text style={[styles.text, { color: c.dark ? '#000' : '#fff' }]}>{t.signInApple}</Text>
        </Pressable>
      )}
      {googleConfigured() ? (
        <GoogleButton onSignedIn={onSignedIn} />
      ) : (
        <Pressable
          onPress={() => Alert.alert(t.signInGoogle, t.googleNotConfigured)}
          style={[styles.btn, { backgroundColor: c.card, borderWidth: StyleSheet.hairlineWidth, borderColor: c.separator, opacity: 0.6 }]}
        >
          <Ionicons name="logo-google" size={19} color="#4285F4" />
          <Text style={[styles.text, { color: c.text }]}>{t.signInGoogle}</Text>
        </Pressable>
      )}
    </View>
  );
}

function GoogleButton({ onSignedIn }: { onSignedIn: Done }) {
  const { t, c } = useStore();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE.webClientId || undefined,
    iosClientId: GOOGLE.iosClientId || undefined,
    androidClientId: GOOGLE.androidClientId || undefined,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params.id_token;
    if (!idToken) return;
    Cloud.signInWithIdp('google.com', idToken)
      .then((s) => onSignedIn(s.email, 'google'))
      .catch((e) => Alert.alert(t.error, e instanceof Error ? e.message : String(e)));
  }, [response]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Pressable
      disabled={!request}
      onPress={() => {
        haptic('light');
        promptAsync();
      }}
      style={({ pressed }) => [styles.btn, { backgroundColor: c.card, borderWidth: StyleSheet.hairlineWidth, borderColor: c.separator, opacity: pressed ? 0.8 : 1 }]}
    >
      <Ionicons name="logo-google" size={19} color="#4285F4" />
      <Text style={[styles.text, { color: c.text }]}>{t.signInGoogle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 12 },
  text: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
});
