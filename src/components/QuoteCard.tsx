import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { pickQuote, QUOTE_CATEGORIES } from '../quotes';
import { useStore } from '../store';
import { haptic } from './ui';
import { Text } from './AppText';

/** Câu nói ngẫu nhiên mỗi lần mở app; chạm để đổi câu. */
export function QuoteCard() {
  const { data, t, sessionSeed } = useStore();
  const s = data.settings;
  const [bump, setBump] = useState(0);
  if (!s.quotesEnabled) return null;
  const q = pickQuote(s.language, s.quoteCategories, (sessionSeed + bump * 0.6180339) % 1);
  if (!q) return null;
  const cat = QUOTE_CATEGORIES.find((x) => x.key === q.category)!;
  const colors: Record<string, [string, string]> = {
    motivation: ['#FF9F0A', '#FF375F'],
    proverb: ['#5E5CE6', '#0A84FF'],
    famous: ['#0AB4FF', '#30D158'],
    funny: ['#BF5AF2', '#FF375F'],
  };
  return (
    <Pressable
      onPress={() => {
        haptic();
        setBump((b) => b + 1);
      }}
    >
      <LinearGradient colors={colors[q.category]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.eyebrow}>
            {cat.icon} {t.quoteOfDay.toUpperCase()}
          </Text>
          <Text style={styles.cat}>{cat.names[s.language]}</Text>
        </View>
        <Text style={styles.quote}>“{q.text}”</Text>
        {q.author ? <Text style={styles.author}>— {q.author}</Text> : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 18, marginBottom: 16 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  eyebrow: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  cat: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  quote: { color: '#fff', fontSize: 19, fontWeight: '600', lineHeight: 26 },
  author: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 8, fontWeight: '500' },
});
