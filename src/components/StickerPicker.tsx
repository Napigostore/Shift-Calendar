import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { FREE_LIMITS } from '../pro';
import { STICKERS } from '../stickers';
import { useStore } from '../store';
import { Chip, haptic } from './ui';
import { Text } from './AppText';

/** Bảng chọn sticker theo nhóm. `max` = 1 thì chọn đơn. */
export function StickerPicker({ value, onChange, max = 3 }: { value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const { data, c, isPro, requirePro } = useStore();
  const [group, setGroup] = useState(STICKERS[0].key);
  const icons = STICKERS.find((g) => g.key === group)!.icons;

  const toggle = (ic: string) => {
    haptic();
    if (value.includes(ic)) onChange(value.filter((x) => x !== ic));
    else onChange(max === 1 ? [ic] : [...value, ic].slice(-max));
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
        {STICKERS.map((g, i) => {
          const locked = !isPro && i >= FREE_LIMITS.stickerGroups;
          return (
            <Chip
              key={g.key}
              label={`${g.icons[0]} ${g.names[data.settings.language]}${locked ? ' 🔒' : ''}`}
              active={g.key === group}
              onPress={() => (!locked || requirePro('stickers')) && setGroup(g.key)}
            />
          );
        })}
      </ScrollView>
      <View style={[styles.grid, { backgroundColor: c.card }]}>
        {icons.map((ic) => {
          const on = value.includes(ic);
          return (
            <Pressable key={ic} onPress={() => toggle(ic)} style={styles.cell}>
              <View style={[styles.bubble, on && { backgroundColor: c.accentSoft, borderColor: c.accent }]}>
                <Text style={styles.emoji}>{ic}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 12, padding: 6 },
  cell: { width: `${100 / 8}%`, aspectRatio: 1, padding: 2 },
  bubble: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  emoji: { fontSize: 24 },
});
