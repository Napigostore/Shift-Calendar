import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const TAB_BAR_HEIGHT = 56;

export function haptic(kind: 'select' | 'light' | 'success' | 'warning' = 'select') {
  if (Platform.OS === 'web') return;
  if (kind === 'select') Haptics.selectionAsync().catch(() => {});
  else if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

/** ScrollView chừa chỗ cho tab bar nổi. */
export function Screen({ children, contentContainerStyle, ...rest }: ScrollViewProps & { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...rest}
      contentContainerStyle={[{ paddingHorizontal: 16, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 32 }, contentContainerStyle]}
    >
      {children}
    </ScrollView>
  );
}

export function LargeTitle({ title, eyebrow, right }: { title: string; eyebrow?: string; right?: React.ReactNode }) {
  const { c } = useStore();
  return (
    <View style={styles.largeWrap}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: c.accent }]}>{eyebrow}</Text> : null}
        <Text style={[styles.largeTitle, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
      </View>
      {right ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{right}</View> : null}
    </View>
  );
}

export function NavHeader({ title, backLabel, onBack, right }: { title: string; backLabel: string; onBack: () => void; right?: React.ReactNode }) {
  const { c } = useStore();
  return (
    <View style={[styles.nav, { borderBottomColor: c.separator }]}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.navBack}>
        <Ionicons name="chevron-back" size={26} color={c.accent} />
        <Text style={{ color: c.accent, fontSize: 17 }} numberOfLines={1}>
          {backLabel}
        </Text>
      </Pressable>
      <Text style={[styles.navTitle, { color: c.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.navRight}>{right}</View>
    </View>
  );
}

export function IconBtn({ name, onPress, color, filled }: { name: IconName; onPress: () => void; color?: string; filled?: boolean }) {
  const { c } = useStore();
  return (
    <Pressable
      onPress={() => {
        haptic();
        onPress();
      }}
      hitSlop={8}
      style={({ pressed }) => [styles.iconBtn, { backgroundColor: filled ? c.accentSoft : c.fill, opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={name} size={19} color={color ?? c.accent} />
    </Pressable>
  );
}

export function IconTile({ name, color, size = 30 }: { name: IconName; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.24, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size * 0.6} color="#fff" />
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useStore();
  return <View style={[styles.card, { backgroundColor: c.card }, style]}>{children}</View>;
}

/** Nhóm danh sách bo góc kiểu iOS Settings (inset grouped). */
export function Group({ header, footer, children, style }: { header?: string; footer?: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useStore();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ marginBottom: 24 }, style]}>
      {header ? <Text style={[styles.groupHeader, { color: c.text2 }]}>{header.toUpperCase()}</Text> : null}
      <View style={[styles.group, { backgroundColor: c.card }]}>
        {items.map((child, i) => (
          <View key={i}>
            {child}
            {i < items.length - 1 ? <View style={[styles.sep, { backgroundColor: c.separator }]} /> : null}
          </View>
        ))}
      </View>
      {footer ? <Text style={[styles.groupFooter, { color: c.text2 }]}>{footer}</Text> : null}
    </View>
  );
}

export function ListRow({
  icon,
  iconColor,
  emoji,
  title,
  subtitle,
  value,
  right,
  onPress,
  chevron,
  destructive,
  checked,
  titleStyle,
}: {
  icon?: IconName;
  iconColor?: string;
  emoji?: string;
  title: string;
  subtitle?: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  checked?: boolean;
  titleStyle?: StyleProp<TextStyle>;
}) {
  const { c } = useStore();
  const body = (pressed: boolean) => (
    <View style={[styles.row, pressed && { backgroundColor: c.fill }]}>
      {icon ? <IconTile name={icon} color={iconColor ?? c.accent} /> : null}
      {emoji ? <Text style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{emoji}</Text> : null}
      <View style={{ flex: 1, paddingVertical: subtitle ? 9 : 13 }}>
        <Text style={[styles.rowTitle, { color: destructive ? c.red : c.text }, titleStyle]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSub, { color: c.text2 }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={{ color: c.text2, fontSize: 17, maxWidth: '45%' }} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right}
      {checked ? <Ionicons name="checkmark" size={22} color={c.accent} /> : null}
      {chevron ?? (!!onPress && !right && checked === undefined) ?<Ionicons name="chevron-forward" size={18} color={c.text3} /> : null}
    </View>
  );
  if (!onPress) return body(false);
  return (
    <Pressable
      onPress={() => {
        haptic();
        onPress();
      }}
    >
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { c } = useStore();
  return (
    <Switch
      value={value}
      onValueChange={(v) => {
        haptic('light');
        onChange(v);
      }}
      trackColor={{ false: c.fill, true: c.green }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={c.fill}
    />
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useStore();
  return (
    <View style={[styles.seg, { backgroundColor: c.fill }, style]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => {
              haptic();
              onChange(o.value);
            }}
            style={[styles.segItem, on && [styles.segOn, { backgroundColor: c.dark ? '#636366' : '#FFFFFF' }]]}
          >
            <Text style={{ color: c.text, fontWeight: on ? '600' : '500', fontSize: 13 }} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Btn({
  title,
  onPress,
  kind = 'filled',
  icon,
  style,
  disabled,
  color,
}: {
  title: string;
  onPress: () => void;
  kind?: 'filled' | 'tinted' | 'plain' | 'destructive' | 'gray';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  color?: string;
}) {
  const { c } = useStore();
  const base = color ?? (kind === 'destructive' ? c.red : c.accent);
  const bg = kind === 'filled' ? base : kind === 'tinted' || kind === 'destructive' ? base + '24' : kind === 'gray' ? c.fill : 'transparent';
  const fg = kind === 'filled' ? '#FFFFFF' : kind === 'gray' ? c.text : base;
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }, style]}
    >
      {icon ? <Ionicons name={icon} size={19} color={fg} /> : null}
      <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label?: string }) {
  const { c } = useStore();
  return (
    <View style={{ marginBottom: 12, flex: 1 }}>
      {label ? <Text style={[styles.fieldLabel, { color: c.text2 }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={c.text3}
        selectionColor={c.accent}
        {...props}
        style={[styles.input, { color: c.text, backgroundColor: c.card }, props.style]}
      />
    </View>
  );
}

/** Ô nhập nằm trong 1 dòng ListRow (nhãn trái, giá trị phải). */
export function InlineInput({ label, ...props }: TextInputProps & { label: string }) {
  const { c } = useStore();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowTitle, { color: c.text, flex: 1, paddingVertical: 13 }]}>{label}</Text>
      <TextInput
        placeholderTextColor={c.text3}
        selectionColor={c.accent}
        {...props}
        style={[{ color: c.text2, fontSize: 17, textAlign: 'right', minWidth: 90, paddingVertical: 8 }, props.style]}
      />
    </View>
  );
}

export function Sheet({
  visible = true,
  onClose,
  title,
  children,
  onDone,
  doneLabel,
  doneDisabled,
  cancelLabel,
  footer,
}: {
  visible?: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onDone?: () => void;
  doneLabel?: string;
  doneDisabled?: boolean;
  cancelLabel?: string;
  footer?: React.ReactNode;
}) {
  const { c, t } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: c.dark ? '#1C1C1E' : '#F2F2F7', paddingBottom: insets.bottom + 12, maxHeight: '92%' }]}>
          <View style={[styles.grabber, { backgroundColor: c.text3 }]} />
          <View style={styles.sheetHeader}>
            <Pressable onPress={onClose} hitSlop={10} style={{ minWidth: 70 }}>
              <Text style={{ color: c.accent, fontSize: 17 }}>{cancelLabel ?? t.cancel}</Text>
            </Pressable>
            <Text style={[styles.sheetTitle, { color: c.text }]} numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              onPress={() => {
                if (doneDisabled || !onDone) return;
                haptic('success');
                onDone();
              }}
              hitSlop={10}
              style={{ minWidth: 70, alignItems: 'flex-end' }}
            >
              {onDone ? (
                <Text style={{ color: doneDisabled ? c.text3 : c.accent, fontSize: 17, fontWeight: '600' }}>{doneLabel ?? t.save}</Text>
              ) : null}
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 99 }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  const { c } = useStore();
  const set = (delta: number) => {
    haptic();
    onChange(Math.min(max, Math.max(min, Math.round((value + delta) * 100) / 100)));
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ color: c.text2, fontSize: 17, minWidth: 28, textAlign: 'right' }}>{value}</Text>
      <View style={[styles.stepper, { backgroundColor: c.fill }]}>
        <Pressable onPress={() => set(-step)} style={styles.stepHalf} hitSlop={4}>
          <Ionicons name="remove" size={20} color={value <= min ? c.text3 : c.text} />
        </Pressable>
        <View style={{ width: StyleSheet.hairlineWidth, height: 18, backgroundColor: c.text3 }} />
        <Pressable onPress={() => set(step)} style={styles.stepHalf} hitSlop={4}>
          <Ionicons name="add" size={20} color={value >= max ? c.text3 : c.text} />
        </Pressable>
      </View>
    </View>
  );
}

export function Chip({ label, color, active, onPress, icon }: { label: string; color?: string; active?: boolean; onPress?: () => void; icon?: IconName }) {
  const { c } = useStore();
  const col = color ?? c.accent;
  return (
    <Pressable
      onPress={() => {
        haptic();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: active ? col : c.dark ? c.card2 : c.card, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={15} color={active ? '#fff' : col} /> : color ? <View style={[styles.dot, { backgroundColor: active ? '#fff' : col }]} /> : null}
      <Text style={{ color: active ? '#fff' : c.text, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const { c } = useStore();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8, marginBottom: 10 }}>
      <Text style={{ color: c.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 }}>{children}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  largeWrap: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 8, paddingBottom: 14 },
  eyebrow: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  largeTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  nav: { flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  navBack: { flexDirection: 'row', alignItems: 'center', maxWidth: '32%', zIndex: 1 },
  navTitle: { position: 'absolute', left: 90, right: 90, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  navRight: { marginLeft: 'auto', paddingRight: 10, zIndex: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  groupHeader: { fontSize: 13, marginLeft: 16, marginBottom: 7, letterSpacing: -0.1 },
  groupFooter: { fontSize: 13, marginHorizontal: 16, marginTop: 7, lineHeight: 18 },
  group: { borderRadius: 12, overflow: 'hidden' },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 58 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 14, minHeight: 46 },
  rowTitle: { fontSize: 17, letterSpacing: -0.4 },
  rowSub: { fontSize: 13, marginTop: 2 },
  seg: { flexDirection: 'row', borderRadius: 9, padding: 2 },
  segItem: { flex: 1, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 7, alignItems: 'center' },
  segOn: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  btn: { flexDirection: 'row', gap: 8, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontWeight: '600', fontSize: 17, letterSpacing: -0.3 },
  fieldLabel: { fontSize: 13, marginBottom: 6, marginLeft: 4 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginTop: 6 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  sheetTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  sheetFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 9, height: 32 },
  stepHalf: { width: 46, height: 32, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, gap: 7 },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
