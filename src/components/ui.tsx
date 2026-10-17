/**
 * Componentes del sistema de diseño, compartidos por todos los módulos
 * (editor, paneles, modales, modo Examen y modo Maestro). Toman colores,
 * radios, bordes y tipografía de `ui/theme.ts`: superficies planas tipo
 * "estampa" con bordes de 2 px, esquinas de 12–16 px y sin sombras; verde
 * para la acción principal y azul para lo interactivo y la selección.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Platform, Pressable, Switch as RNSwitch, ScrollView, StyleProp, StyleSheet, SwitchProps, TextInputProps, TextStyle, useWindowDimensions, View, ViewStyle } from 'react-native';
import { tokenize } from '../core/editor/tokenizer';
import { Text, TextInput } from '../ui/text';
import { BORDER, MONO, RADIUS, SPACE, TYPE, useTheme } from '../ui/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

const WEB_PRE: any = Platform.OS === 'web' ? { whiteSpace: 'pre' } : null;
const NO_OUTLINE: any = Platform.OS === 'web' ? { outlineStyle: 'none' } : null;

/** Color con transparencia (para fondos suaves derivados de un color #rrggbb). */
export const tint = (color: string, alpha: number) =>
  /^#[0-9a-f]{6}$/i.test(color)
    ? color +
      Math.round(alpha * 255)
        .toString(16)
        .padStart(2, '0')
    : color;

export const ModalContext = React.createContext<boolean>(false);

/** Pantalla de teléfono (menos de 600 px): componentes en versión compacta. */
export function useIsPhone() {
  return useWindowDimensions().width < 600;
}

/** Botón "Volver al editor" de las pantallas de Maestro y Examen (corto en teléfonos). */
export function BackToEditorButton({ onPress }: { onPress(): void }) {
  const phone = useIsPhone();
  return <Button label={phone ? 'Editor' : 'Volver al editor'} icon="arrow-back" size={phone ? 'sm' : 'md'} onPress={onPress} />;
}

// ───────────────────────────── globo de ayuda ─────────────────────────────

function TipBubble({ text, position }: { text: string; position: 'top' | 'bottom' }) {
  const t = useTheme();
  return (
    <View style={[styles.tooltipBubble, position === 'top' ? styles.tooltipTop : styles.tooltipBottom, { backgroundColor: t.ink }]}>
      <Text style={styles.tooltipText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

/** Pone el texto como `title` nativo del navegador (accesible y con teclado). */
function useWebTitle(text?: string) {
  const ref = React.useRef<any>(null);
  React.useEffect(() => {
    if (Platform.OS !== 'web' || !ref.current) return;
    try {
      if (text) ref.current.setAttribute?.('title', text);
      else ref.current.removeAttribute?.('title');
    } catch {}
  }, [text]);
  return ref;
}

export function Tooltip({ text, children, position = 'bottom' }: { text: string; children: React.ReactNode; position?: 'top' | 'bottom' }) {
  const inModal = React.useContext(ModalContext);
  const [hovered, setHovered] = React.useState(false);
  const ref = useWebTitle(inModal ? undefined : text);
  if (inModal) return <>{children}</>;
  return (
    <View ref={ref} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} style={styles.tooltipContainer}>
      {children}
      {hovered ? <TipBubble text={text} position={position} /> : null}
    </View>
  );
}

// ───────────────────────────── botones ─────────────────────────────

export function IconButton({
  icon,
  label,
  tooltip,
  onPress,
  disabled,
  color,
  active,
  showLabel,
  size = 20,
  style,
}: {
  icon: IconName;
  label: string;
  tooltip?: string;
  onPress(): void;
  disabled?: boolean;
  color?: string;
  active?: boolean;
  showLabel?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const inModal = React.useContext(ModalContext);
  const c = disabled ? t.textFaint : active ? t.accent : color ?? t.textMuted;
  const tipText = inModal ? undefined : tooltip;
  const ref = useWebTitle(tipText);
  const [hovered, setHovered] = React.useState(false);

  const button = (
    <Pressable
      ref={ref}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPointerEnter={() => tipText && setHovered(true)}
      onPointerLeave={() => tipText && setHovered(false)}
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: active ? t.accentSoft : pressed || hovered ? t.surfaceAlt : 'transparent', borderColor: active ? t.accent : 'transparent' },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={c} />
      {showLabel ? (
        <Text style={[styles.iconLabel, { color: disabled ? t.textFaint : t.text }]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );

  if (!tipText) return button;
  return (
    <View style={styles.tooltipContainer}>
      {button}
      {hovered ? <TipBubble text={tipText} position="bottom" /> : null}
    </View>
  );
}

export type ButtonKind = 'primary' | 'secondary' | 'danger' | 'ghost' | 'default';

/**
 * Botón con etiqueta en mayúsculas. `primary` (verde) es la acción principal;
 * `secondary`/`default` es el botón delineado azul; `danger` para acciones
 * destructivas; `ghost` para acciones discretas.
 */
export function Button({
  label,
  onPress,
  icon,
  kind = 'default',
  size = 'md',
  disabled,
  style,
}: {
  label: string;
  onPress(): void;
  icon?: IconName;
  kind?: ButtonKind;
  size?: 'md' | 'sm';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const k = kind === 'default' ? 'secondary' : kind;
  const fill = k === 'primary' ? t.primary : k === 'danger' ? t.danger : 'transparent';
  const pressedFill = k === 'primary' ? t.primaryDark : k === 'danger' ? t.danger : t.surfaceAlt;
  const fg = disabled ? t.textFaint : k === 'primary' || k === 'danger' ? '#ffffff' : k === 'ghost' ? t.textMuted : t.accent;
  const border = disabled ? t.border : k === 'primary' ? t.primary : k === 'danger' ? t.danger : k === 'ghost' ? 'transparent' : t.borderStrong;
  const sm = size === 'sm';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.btn,
        sm && styles.btnSm,
        { backgroundColor: disabled ? t.surfaceAlt : pressed ? pressedFill : fill, borderColor: border, opacity: pressed && k === 'danger' ? 0.85 : 1 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={sm ? 14 : 16} color={fg} style={{ marginRight: 6 }} /> : null}
      <Text style={[styles.btnText, sm && { fontSize: 12 }, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

// ───────────────────────────── navegación y selección ─────────────────────────────

/**
 * Pestaña de navegación: etiqueta en mayúsculas, verde y subrayada si está
 * activa. Con `compact` (pantallas angostas) las inactivas muestran solo el icono.
 */
export function Tab({ label, active, onPress, badge, icon, compact }: { label: string; active: boolean; onPress(): void; badge?: number | string; icon?: IconName; compact?: boolean }) {
  const t = useTheme();
  const c = active ? t.primary : t.textMuted;
  const iconOnly = !!compact && !active && !!icon;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[styles.tab, iconOnly && styles.tabIcon, { borderBottomColor: active ? t.primary : 'transparent' }]}
    >
      {icon ? <Ionicons name={icon} size={iconOnly ? 18 : 15} color={c} style={iconOnly ? null : { marginRight: 6 }} /> : null}
      {iconOnly ? null : (
        <Text style={[styles.tabText, { color: c }]} numberOfLines={1}>
          {label}
        </Text>
      )}
      {badge ? (
        <View style={[styles.badge, { backgroundColor: t.danger }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Opción seleccionable (azul cuando está activa). */
export function Chip({ label, active, onPress, style }: { label: string; active?: boolean; onPress(): void; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: active ? t.accentSoft : pressed ? t.surfaceAlt : t.surface, borderColor: active ? t.accent : t.border },
        style,
      ]}
    >
      <Text style={{ color: active ? t.accentDark : t.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange, style }: { options: { id: T; label: string; icon?: IconName }[]; value: T; onChange(v: T): void; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[styles.segmented, { borderColor: t.border, backgroundColor: t.surfaceAlt }, style]}>
      {options.map((o) => {
        const active = o.id === value;
        const c = active ? t.accentDark : t.textMuted;
        return (
          <Pressable
            key={String(o.id)}
            onPress={() => onChange(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, { backgroundColor: active ? t.surface : 'transparent', borderColor: active ? t.accent : 'transparent' }]}
          >
            {o.icon ? <Ionicons name={o.icon} size={14} color={c} style={{ marginRight: 5 }} /> : null}
            <Text style={{ color: c, fontWeight: '800', fontSize: 13 }} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ───────────────────────────── texto y estados ─────────────────────────────

/**
 * Encabezados estándar: `display` y `section` en el verde de la marca (títulos
 * de sección, como en la guía de estilo); `title` en gris carbón (diálogos y
 * tarjetas).
 */
export function Heading({ children, level = 'section', style }: { children: React.ReactNode; level?: 'display' | 'section' | 'title'; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  const base = level === 'display' ? TYPE.display : level === 'section' ? TYPE.heading : TYPE.subheading;
  return <Text style={[base, { color: level === 'title' ? t.text : t.primary }, style]}>{children}</Text>;
}

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[styles.section, { color: t.textMuted }, style]}>{children}</Text>;
}

export function Empty({ icon, text }: { icon: IconName; text: string }) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color={t.textFaint} />
      <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: SPACE.sm, ...TYPE.bodySm, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

/** Etiqueta pequeña de estado. */
export function Pill({ text, color, icon, solid }: { text: string; color?: string; icon?: IconName; solid?: boolean }) {
  const t = useTheme();
  const c = color ?? t.textMuted;
  return (
    <View style={[styles.pill, { backgroundColor: solid ? c : tint(c, 0.12), borderColor: solid ? c : tint(c, 0.4) }]}>
      {icon ? <Ionicons name={icon} size={12} color={solid ? '#fff' : c} style={{ marginRight: 4 }} /> : null}
      <Text style={{ color: solid ? '#fff' : c, fontSize: 11, fontWeight: '800' }} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export function Banner({ icon, text, color, onClose, action }: { icon: IconName; text: string; color: string; onClose?(): void; action?: { label: string; onPress(): void } }) {
  const t = useTheme();
  return (
    <View style={[styles.banner, { backgroundColor: tint(color, 0.1), borderColor: tint(color, 0.45) }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ color: t.text, flex: 1, marginLeft: SPACE.sm, ...TYPE.bodySm, fontWeight: '600' }}>{text}</Text>
      {action ? (
        <Pressable onPress={action.onPress} style={({ pressed }) => [styles.bannerBtn, { backgroundColor: color, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={styles.bannerBtnText}>{action.label}</Text>
        </Pressable>
      ) : null}
      {onClose ? (
        <Pressable onPress={onClose} hitSlop={8} style={{ marginLeft: SPACE.sm }} accessibilityLabel="Cerrar aviso">
          <Ionicons name="close" size={16} color={t.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProgressBar({ value, color, height = 10, style }: { value: number; color?: string; height?: number; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: t.border, overflow: 'hidden' }, style]}>
      <View style={{ width: `${v * 100}%`, height, borderRadius: height / 2, backgroundColor: color ?? t.primary }} />
    </View>
  );
}

// ───────────────────────────── superficies ─────────────────────────────

/** Tarjeta plana con borde de 2 px (con `accent`, el borde toma ese color). */
export function Card({ children, style, accent }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.surface, borderColor: accent ?? t.border }, style]}>{children}</View>;
}

export function Stat({ label, value, icon, color, sub }: { label: string; value: string | number; icon: IconName; color?: string; sub?: string }) {
  const t = useTheme();
  const c = color ?? t.primary;
  return (
    <View style={[styles.stat, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={[styles.statIcon, { backgroundColor: tint(c, 0.14) }]}>
        <Ionicons name={icon} size={18} color={c} />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={{ color: t.text, fontSize: 20, fontWeight: '900' }} numberOfLines={1}>
          {value}
        </Text>
        <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
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

/** Botón grande de opción con icono, título y descripción. */
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
        { borderColor: selected ? c : t.border, backgroundColor: selected ? tint(c, 0.08) : pressed ? t.surfaceAlt : t.surface, opacity: disabled ? 0.45 : 1 },
        style,
      ]}
    >
      <View style={[styles.bigIcon, { backgroundColor: tint(c, 0.14) }]}>
        <Ionicons name={icon} size={24} color={c} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: t.textMuted, ...TYPE.bodySm, marginTop: 3 }}>{description}</Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={c} /> : <Ionicons name="chevron-forward" size={18} color={t.textFaint} />}
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
      <View style={{ flex: 1, marginLeft: SPACE.md }}>
        <Text style={{ color: t.text, ...TYPE.subheading }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
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
              {l.length ? l.map((p, k) => <Text key={k} style={{ color: p.color, fontFamily: MONO }}>{p.text}</Text>) : ' '}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ───────────────────────────── formularios ─────────────────────────────

export function Field({ label, hint, children, style }: { label: string; hint?: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[{ marginBottom: SPACE.lg }, style]}>
      <Text style={{ color: t.text, fontWeight: '800', fontSize: 14, marginBottom: 6 }}>{label}</Text>
      {children}
      {hint ? <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 }}>{hint}</Text> : null}
    </View>
  );
}

export function TextField({ mono, style, minHeight, ...props }: TextInputProps & { mono?: boolean; minHeight?: number }) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.textFaint}
      autoCorrect={!mono}
      autoCapitalize={mono ? 'none' : props.autoCapitalize}
      spellCheck={!mono}
      textAlignVertical={props.multiline ? 'top' : 'center'}
      {...props}
      style={[
        styles.input,
        { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt, minHeight: minHeight ?? (props.multiline ? 72 : 44) },
        mono ? { fontFamily: MONO, fontSize: 13 } : null,
        mono && props.multiline ? WEB_PRE : null,
        NO_OUTLINE,
        style,
      ]}
    />
  );
}

/** Interruptor con los colores de la marca. */
export function Switch(props: SwitchProps) {
  const t = useTheme();
  return <RNSwitch trackColor={{ true: t.primary, false: t.border }} thumbColor="#fff" {...({ activeThumbColor: '#fff' } as object)} {...props} />;
}

export function Toggle({ label, description, value, onChange, icon, disabled }: { label: string; description?: string; value: boolean; onChange(v: boolean): void; icon?: IconName; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={() => !disabled && onChange(!value)} style={[styles.toggle, { borderColor: t.border, opacity: disabled ? 0.6 : 1 }]} accessibilityRole="switch" accessibilityState={{ checked: value, disabled }}>
      {icon ? <Ionicons name={icon} size={18} color={value ? t.primary : t.textMuted} style={{ marginRight: 10 }} /> : null}
      <View style={{ flex: 1, marginRight: 10 }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }}>{label}</Text>
        {description ? <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 }}>{description}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} />
    </Pressable>
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
  const commit = () => {
    const n = Number(text.replace(',', '.'));
    if (Number.isFinite(n)) onChange(clamp(n));
    else setText(String(value));
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable onPress={() => onChange(clamp(value - step))} style={[styles.stepBtn, { borderColor: t.border, backgroundColor: t.surface }]} accessibilityLabel="Menos">
        <Ionicons name="remove" size={16} color={t.accent} />
      </Pressable>
      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="numeric"
        style={[styles.stepInput, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt, width }, NO_OUTLINE]}
      />
      <Pressable onPress={() => onChange(clamp(value + step))} style={[styles.stepBtn, { borderColor: t.border, backgroundColor: t.surface }]} accessibilityLabel="Más">
        <Ionicons name="add" size={16} color={t.accent} />
      </Pressable>
      {suffix ? <Text style={{ color: t.textMuted, marginLeft: SPACE.sm, fontSize: 13, fontWeight: '600' }}>{suffix}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // botones
  iconBtn: { minWidth: 38, height: 38, borderRadius: RADIUS.md, borderWidth: BORDER, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, flexDirection: 'row' },
  iconLabel: { fontSize: 13, marginLeft: 5, fontWeight: '700' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE.lg, height: 42, borderRadius: RADIUS.md, borderWidth: BORDER },
  btnSm: { height: 34, paddingHorizontal: SPACE.md },
  btnText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  // navegación
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 44, borderBottomWidth: 3 },
  tabIcon: { paddingHorizontal: 9 },
  tabText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  badge: { marginLeft: 6, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  chip: { height: 36, justifyContent: 'center', paddingHorizontal: SPACE.md, borderRadius: RADIUS.md, borderWidth: BORDER, marginRight: 6, marginBottom: 6 },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: RADIUS.md, borderWidth: BORDER, padding: 3, alignSelf: 'flex-start' },
  segment: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.md, paddingVertical: 7, borderRadius: 10, borderWidth: BORDER },
  // texto y estados
  section: { ...TYPE.label, marginTop: SPACE.lg, marginBottom: SPACE.sm },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 28 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.sm, paddingVertical: 2, borderRadius: RADIUS.md, borderWidth: BORDER, alignSelf: 'flex-start' },
  banner: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.md, paddingHorizontal: SPACE.md, paddingVertical: 10, marginBottom: 10 },
  bannerBtn: { paddingHorizontal: SPACE.md, paddingVertical: 6, borderRadius: RADIUS.md, marginLeft: SPACE.sm },
  bannerBtnText: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
  // superficies
  card: { borderWidth: BORDER, borderRadius: RADIUS.lg, padding: SPACE.lg, marginBottom: SPACE.md },
  stat: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.lg, padding: SPACE.md, minWidth: 150, flexGrow: 1, flexBasis: 150, margin: 4 },
  statIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  big: { flexDirection: 'row', alignItems: 'center', borderWidth: BORDER, borderRadius: RADIUS.lg, padding: SPACE.lg, marginBottom: 10 },
  bigIcon: { width: 48, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.md, paddingVertical: 10, borderBottomWidth: BORDER },
  headerIcon: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  code: { borderWidth: BORDER, borderRadius: RADIUS.md, marginVertical: SPACE.sm, flexGrow: 0 },
  // formularios
  input: { borderWidth: BORDER, borderRadius: RADIUS.md, paddingHorizontal: SPACE.md, paddingVertical: 10, fontSize: 15 },
  toggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.md, borderBottomWidth: BORDER },
  stepBtn: { width: 36, height: 38, borderWidth: BORDER, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  stepInput: { height: 38, borderWidth: BORDER, borderRadius: RADIUS.md, marginHorizontal: 6, textAlign: 'center', fontSize: 15, fontWeight: '800' },
  // globo de ayuda
  tooltipContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  tooltipBubble: {
    position: 'absolute',
    zIndex: 999999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  tooltipBottom: { top: 44 },
  tooltipTop: { bottom: 44 },
  tooltipText: { color: '#ffffff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
