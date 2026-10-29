// Biểu tượng: SF Symbols thật trên iOS / iPadOS / Mac, Ionicons trên Android và web.
import { Ionicons } from '@expo/vector-icons';
import { SFSymbol, SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, StyleProp, TextStyle, ViewStyle } from 'react-native';

type IonName = React.ComponentProps<typeof Ionicons>['name'];

const SF: Partial<Record<string, SFSymbol>> = {
  add: 'plus',
  'add-circle': 'plus.circle.fill',
  airplane: 'airplane',
  alarm: 'alarm.fill',
  'alarm-outline': 'alarm',
  apps: 'square.grid.2x2.fill',
  'arrow-down': 'arrow.down',
  'arrow-redo': 'arrowshape.turn.up.right.fill',
  'arrow-up': 'arrow.up',
  ban: 'nosign',
  'bar-chart': 'chart.bar.fill',
  bed: 'bed.double.fill',
  boat: 'sailboat.fill',
  book: 'book.fill',
  briefcase: 'briefcase.fill',
  brush: 'paintbrush.fill',
  business: 'building.2.fill',
  cafe: 'cup.and.saucer.fill',
  calendar: 'calendar',
  'calendar-number': 'calendar.badge.clock',
  'calendar-outline': 'calendar',
  cash: 'banknote.fill',
  'chatbubble-ellipses': 'ellipsis.message.fill',
  checkmark: 'checkmark',
  'checkmark-circle': 'checkmark.circle.fill',
  'checkmark-done': 'checkmark.seal.fill',
  'chevron-back': 'chevron.left',
  'chevron-forward': 'chevron.right',
  close: 'xmark',
  cloud: 'cloud.fill',
  'cloud-done': 'checkmark.icloud.fill',
  'cloud-download': 'icloud.and.arrow.down.fill',
  'cloud-upload': 'icloud.and.arrow.up.fill',
  'cloudy-night': 'cloud.moon.fill',
  'color-palette': 'paintpalette.fill',
  contract: 'arrow.down.right.and.arrow.up.left',
  contrast: 'circle.lefthalf.filled',
  document: 'doc.fill',
  'document-text': 'doc.text.fill',
  'document-text-outline': 'doc.text',
  download: 'square.and.arrow.down',
  earth: 'globe.asia.australia.fill',
  'ellipse-outline': 'circle',
  'ellipsis-horizontal-circle': 'ellipsis.circle',
  flag: 'flag.fill',
  flash: 'bolt.fill',
  gift: 'gift.fill',
  globe: 'globe',
  grid: 'square.grid.3x3.fill',
  happy: 'face.smiling.fill',
  image: 'photo.fill',
  infinite: 'infinity',
  'information-circle': 'info.circle.fill',
  layers: 'square.3.layers.3d',
  leaf: 'leaf.fill',
  'lock-closed': 'lock.fill',
  'lock-open': 'lock.open.fill',
  'shield-checkmark': 'checkmark.shield.fill',
  'battery-half': 'battery.50percent',
  'leaf-outline': 'wind',
  list: 'list.bullet',
  location: 'location.fill',
  'location-outline': 'location',
  'logo-apple': 'apple.logo',
  medkit: 'cross.case.fill',
  moon: 'moon.fill',
  navigate: 'location.fill',
  notifications: 'bell.fill',
  'notifications-outline': 'bell',
  options: 'slider.horizontal.3',
  'partly-sunny': 'cloud.sun.fill',
  people: 'person.2.fill',
  'people-outline': 'person.2',
  person: 'person.fill',
  'person-add': 'person.badge.plus',
  'person-circle': 'person.crop.circle.fill',
  'phone-portrait-outline': 'iphone',
  'pie-chart': 'chart.pie.fill',
  'pie-chart-outline': 'chart.pie',
  refresh: 'arrow.clockwise',
  remove: 'minus',
  repeat: 'repeat',
  scan: 'faceid',
  settings: 'gearshape.fill',
  'settings-outline': 'gearshape',
  share: 'square.and.arrow.up',
  sparkles: 'sparkles',
  'stats-chart': 'chart.bar.xaxis',
  sunny: 'sun.max.fill',
  'sunny-outline': 'sun.max',
  sync: 'arrow.triangle.2.circlepath',
  thermometer: 'thermometer.medium',
  'thermometer-outline': 'thermometer.medium',
  thunderstorm: 'cloud.bolt.rain.fill',
  time: 'clock.fill',
  'time-outline': 'clock',
  timer: 'timer',
  today: 'calendar.day.timeline.left',
  toggle: 'switch.2',
  'trash-outline': 'trash',
  'umbrella-outline': 'umbrella',
  wallet: 'wallet.pass.fill',
  warning: 'exclamationmark.triangle.fill',
  water: 'drop.fill',
  'water-outline': 'drop',
};

export function Icon({ name, size = 22, color, style }: { name: IonName; size?: number; color?: string; style?: StyleProp<ViewStyle & TextStyle> }) {
  const sf = Platform.OS === 'ios' ? SF[name] : undefined;
  if (sf) {
    return (
      <SymbolView
        name={sf}
        size={size}
        tintColor={color}
        type="monochrome"
        weight="medium"
        style={[{ width: size, height: size }, style]}
        fallback={<Ionicons name={name} size={size} color={color} />}
      />
    );
  }
  return <Ionicons name={name} size={size} color={color} style={style as never} />;
}
