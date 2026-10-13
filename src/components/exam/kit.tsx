/** Componentes de interfaz compartidos por el modo Maestro y el modo Examen. */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleProp, StyleSheet, Switch, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { tokenize } from '../../core/editor/tokenizer';
import { MONO, useTheme } from '../../ui/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

const WEB_PRE: any = Platform.OS === 'web' ? { whiteSpace: 'pre' } : null;
const NO_OUTLINE: any = Platform.OS === 'web' ? { outlineStyle: 'none' } : null;

export function Card({ children, style, accent }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.surface, borderColor: accent ?? t.border, borderLeftWidth: accent ? 4 : StyleSheet.hairlineWidth },
        Platform.select({ web: { boxShadow: t.dark ? 'none' : '0 1px 3px rgba(20, 30, 60, 0.07)' } as any, default: {} }),
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Field({ label, hint, children, style }: { label: string; hint?: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <Text style={{ color: t.text, fontWeight: '700', fontSize: 13, marginBottom: 6 }}>{label}</Text>
      {children}
      {hint ? <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 }}>{hint}</Text> : null}
    </View>
  );
}

export function TextField({ mono, style, minHeight, ...props }: TextInputProps & { mono?: boolean; minHeight?: number }) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.textMuted}
      autoCorrect={!mono}
      autoCapitalize={mono ? 'none' : props.autoCapitalize}
      spellCheck={!mono}
      textAlignVertical={props.multiline ? 'top' : 'center'}
      {...props}
      style={[
        styles.input,
        { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt, minHeight: minHeight ?? (props.multiline ? 72 : 40) },
        mono ? { fontFamily: MONO, fontSize: 13 } : null,
        mono && props.multiline ? WEB_PRE : null,
        NO_OUTLINE,
        style,
      ]}
    />
  );
}

export function Toggle({ label, description, value, onChange, icon, disabled }: { label: string; description?: string; value: boolean; onChange(v: boolean): void; icon?: IconName; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={() => !disabled && onChange(!value)} style={[styles.toggle, { borderColor: t.border, opacity: disabled ? 0.6 : 1 }]} accessibilityRole="switch" accessibilityState={{ checked: value, disabled }}>
      {icon ? <Ionicons name={icon} size={18} color={value ? t.primary : t.textMuted} style={{ marginRight: 10 }} /> : null}
      <View style={{ flex: 1, marginRight: 10 }}>
        <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>{label}</Text>
        {description ? <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 }}>{description}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ true: t.primary, false: t.border }} thumbColor="#fff" {...({ activeThumbColor: '#fff' } as object)} />
    </Pressable>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange, style }: { options: { id: T; label: string; icon?: IconName }[]; value: T; onChange(v: T): void; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[styles.segmented, { borderColor: t.border, backgroundColor: t.surfaceAlt }, style]}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={String(o.id)}
            onPress={() => onChange(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, { backgroundColor: active ? t.surface : 'transparent', borderColor: active ? t.primary : 'transparent' }]}
          >
            {o.icon ? <Ionicons name={o.icon} size={14} color={active ? t.primary : t.textMuted} style={{ marginRight: 5 }} /> : null}
            <Text style={{ color: active ? t.primary : t.text, fontWeight: active ? '700' : '500', fontSize: 13 }} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function NumberStepper({ value, onChange, min = 0, max = 9999, step = 1, suffix, width = 64 }: { value: number; onChange(v: number): void; min?: number; max?: number; step?: number; suffix?: string; width?: number }) {
  const t = useTheme();
  const [text, setText] = React.useState(String(value));
  const [shown, setShown] = React.useState(value);
  if (shown !== value) {
    // el valor cambió desde fuera (botones o el padre)
    setShown(value);
    setText(String(value));
  }
  const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n * 100) / 100));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable onPress={() => onChange(clamp(value - step))} style={[styles.stepBtn, { borderColor: t.border, backgroundColor: t.surfaceAlt }]} accessibilityLabel="Menos">
        <Ionicons name="remove" size={16} color={t.text} />
      </Pressable>
      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={() => {
          const n = Number(text.replace(',', '.'));
          if (Number.isFinite(n)) onChange(clamp(n));
          else setText(String(value));
        }}
        onSubmitEditing={() => {
          const n = Number(text.replace(',', '.'));
          if (Number.isFinite(n)) onChange(clamp(n));
        }}
        keyboardType="numeric"
        style={[styles.stepInput, { color: t.text, borderColor: t.border, backgroundColor: t.surface, width }, NO_OUTLINE]}
      />
      <Pressable onPress={() => onChange(clamp(value + step))} style={[styles.stepBtn, { borderColor: t.border, backgroundColor: t.surfaceAlt }]} accessibilityLabel="Más">
        <Ionicons name="add" size={16} color={t.text} />
      </Pressable>
      {suffix ? <Text style={{ color: t.textMuted, marginLeft: 8, fontSize: 13 }}>{suffix}</Text> : null}
    </View>
  );
}

export function Pill({ text, color, icon, solid }: { text: string; color?: string; icon?: IconName; solid?: boolean }) {
  const t = useTheme();
  const c = color ?? t.textMuted;
  return (
    <View style={[styles.pill, { backgroundColor: solid ? c : c + '1f', borderColor: c + '55' }]}>
      {icon ? <Ionicons name={icon} size={12} color={solid ? '#fff' : c} style={{ marginRight: 4 }} /> : null}
      <Text style={{ color: solid ? '#fff' : c, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export function ProgressBar({ value, color, height = 6, style }: { value: number; color?: string; height?: number; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: t.surfaceAlt, overflow: 'hidden' }, style]}>
      <View style={{ width: `${v * 100}%`, height, borderRadius: height / 2, backgroundColor: color ?? t.primary }} />
    </View>
  );
}

export function Stat({ label, value, icon, color, sub }: { label: string; value: string | number; icon: IconName; color?: string; sub?: string }) {
  const t = useTheme();
  const c = color ?? t.primary;
  return (
    <View style={[styles.stat, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={[styles.statIcon, { backgroundColor: c + '1f' }]}>
        <Ionicons name={icon} size={18} color={c} />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={{ color: t.text, fontSize: 20, fontWeight: '800' }} numberOfLines={1}>
          {value}
        </Text>
        <Text style={{ color: t.textMuted, fontSize: 12 }} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text style={{ color: t.textMuted, fontSize: 11 }} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Bloque de código de solo lectura con resaltado. */
export function CodeBlock({ code, maxHeight, style }: { code: string; maxHeight?: number; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const lines = useMemo(() => {
    const out: { text: string; color: string }[][] = [[]];
    for (const tok of tokenize(code.replace(/\s+$/, ''))) {
      const color = (t.syntax as any)[tok.type] ?? t.text;
      const parts = tok.text.split('\n');
      parts.forEach((p, i) => {
        if (i > 0) out.push([]);
        if (p) out[out.length - 1].push({ text: p, color });
      });
    }
    return out;
  }, [code, t]);
  return (
    <ScrollView horizontal style={[styles.code, { backgroundColor: t.gutter, borderColor: t.border, maxHeight }, style]} contentContainerStyle={{ padding: 10 }}>
      <View>
        {lines.map((l, i) => (
          <View key={i} style={{ flexDirection: 'row' }}>
            <Text style={[{ color: t.gutterText, fontFamily: MONO, fontSize: 13, lineHeight: 20, width: 26, textAlign: 'right', marginRight: 10 }]} selectable={false}>
              {i + 1}
            </Text>
            <Text style={[{ fontFamily: MONO, fontSize: 13, lineHeight: 20, color: t.text }, WEB_PRE]} selectable={false}>
              {l.length ? l.map((p, k) => <Text key={k} style={{ color: p.color }}>{p.text}</Text>) : ' '}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/** Botón grande de acción con icono, título y descripción. */
export function BigChoice({ icon, title, description, onPress, color, selected, disabled, style }: { icon: IconName; title: string; description: string; onPress(): void; color?: string; selected?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const c = color ?? t.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.big,
        { borderColor: selected ? c : t.border, backgroundColor: selected ? c + '12' : pressed ? t.surfaceAlt : t.surface, opacity: disabled ? 0.45 : 1 },
        style,
      ]}
    >
      <View style={[styles.bigIcon, { backgroundColor: c + '1f' }]}>
        <Ionicons name={icon} size={24} color={c} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 3, lineHeight: 18 }}>{description}</Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={c} /> : <Ionicons name="chevron-forward" size={18} color={t.textMuted} />}
    </Pressable>
  );
}

/** Encabezado de pantalla completa (modo Maestro / Examen). */
export function ScreenHeader({ icon, title, subtitle, color, left, right }: { icon: IconName; title: string; subtitle?: string; color?: string; left?: React.ReactNode; right?: React.ReactNode }) {
  const t = useTheme();
  const c = color ?? t.primary;
  return (
    <View style={[styles.header, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
      {left}
      <View style={[styles.headerIcon, { backgroundColor: c }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: t.textMuted, fontSize: 12 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Banner({ icon, text, color, onClose, action }: { icon: IconName; text: string; color: string; onClose?(): void; action?: { label: string; onPress(): void } }) {
  const t = useTheme();
  return (
    <View style={[styles.banner, { backgroundColor: color + '18', borderColor: color + '66' }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ color: t.text, flex: 1, marginLeft: 8, fontSize: 13, lineHeight: 18 }}>{text}</Text>
      {action ? (
        <Pressable onPress={action.onPress} style={[styles.bannerBtn, { backgroundColor: color }]}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{action.label}</Text>
        </Pressable>
      ) : null}
      {onClose ? (
        <Pressable onPress={onClose} hitSlop={8} style={{ marginLeft: 8 }} accessibilityLabel="Cerrar aviso">
          <Ionicons name="close" size={16} color={t.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatSince(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 16, marginBottom: 12 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  toggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, padding: 3, alignSelf: 'flex-start' },
  segment: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  stepBtn: { width: 34, height: 36, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepInput: { height: 36, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, marginHorizontal: 6, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start' },
  stat: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, minWidth: 150, flexGrow: 1, flexBasis: 150, margin: 4 },
  statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  code: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, marginVertical: 8, flexGrow: 0 },
  big: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 10 },
  bigIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  headerIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10 },
  bannerBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginLeft: 8 },
});
