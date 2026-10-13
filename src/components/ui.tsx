import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useTheme } from '../ui/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const ModalContext = React.createContext<boolean>(false);

export function Tooltip({
  text,
  children,
  position = 'bottom',
}: {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}) {
  const t = useTheme();
  const inModal = React.useContext(ModalContext);
  const [hovered, setHovered] = React.useState(false);
  const domRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (Platform.OS === 'web' && domRef.current) {
      try {
        if (!inModal && text) {
          domRef.current.title = text;
          domRef.current.setAttribute?.('title', text);
        } else {
          domRef.current.removeAttribute?.('title');
        }
      } catch { }
    }
  }, [text, inModal]);

  if (inModal) {
    return <>{children}</>;
  }

  return (
    <View
      ref={domRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={styles.tooltipContainer}
    >
      {children}
      {hovered ? (
        <View
          style={[
            styles.tooltipBubble,
            position === 'top' ? styles.tooltipTop : styles.tooltipBottom,
            {
              backgroundColor: t.dark ? '#222226' : '#1e1e24',
              borderColor: t.dark ? '#404048' : '#333338',
            },
          ]}
        >
          <Text style={styles.tooltipText} numberOfLines={1}>
            {text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

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
  const c = disabled ? t.border : color ?? t.text;
  const tipText = inModal ? undefined : tooltip;
  const domRef = React.useRef<any>(null);
  const [hovered, setHovered] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS === 'web' && domRef.current) {
      try {
        if (tipText) {
          domRef.current.title = tipText;
          domRef.current.setAttribute?.('title', tipText);
        } else {
          domRef.current.removeAttribute?.('title');
        }
      } catch { }
    }
  }, [tipText]);

  const button = (
    <Pressable
      ref={domRef}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPointerEnter={() => {
        if (tipText) setHovered(true);
      }}
      onPointerLeave={() => {
        if (tipText) setHovered(false);
      }}
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: active ? t.surfaceAlt : pressed ? t.surfaceAlt : 'transparent' },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={c} />
      {showLabel ? <Text style={[styles.iconLabel, { color: c }]} numberOfLines={1}>{label}</Text> : null}
    </Pressable>
  );

  if (!tipText) {
    return button;
  }

  return (
    <View style={styles.tooltipContainer}>
      {button}
      {hovered ? (
        <View
          style={[
            styles.tooltipBubble,
            styles.tooltipBottom,
            {
              backgroundColor: t.dark ? '#222226' : '#1e1e24',
              borderColor: t.dark ? '#404048' : '#333338',
            },
          ]}
        >
          <Text style={styles.tooltipText} numberOfLines={1}>
            {tipText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  icon,
  kind = 'default',
  disabled,
  style,
}: {
  label: string;
  onPress(): void;
  icon?: IconName;
  kind?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.primary : kind === 'danger' ? t.danger : t.surfaceAlt;
  const fg = kind === 'default' ? t.text : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1, borderColor: t.border }, style]}
    >
      {icon ? <Ionicons name={icon} size={16} color={fg} style={{ marginRight: 6 }} /> : null}
      <Text style={{ color: fg, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Tab({ label, active, onPress, badge, icon }: { label: string; active: boolean; onPress(): void; badge?: number | string; icon?: IconName }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} style={[styles.tab, { borderBottomColor: active ? t.primary : 'transparent' }]}>
      {icon ? <Ionicons name={icon} size={15} color={active ? t.primary : t.textMuted} style={{ marginRight: 5 }} /> : null}
      <Text style={{ color: active ? t.primary : t.textMuted, fontWeight: active ? '700' : '500', fontSize: 13 }}>{label}</Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: t.danger }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, style }: { label: string; active?: boolean; onPress(): void; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? t.primary : t.surfaceAlt, borderColor: active ? t.primary : t.border }, style]}
    >
      <Text style={{ color: active ? t.primaryText : t.text, fontSize: 13, fontWeight: active ? '700' : '500' }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[styles.section, { color: t.textMuted }, style]}>{children}</Text>;
}

export function Empty({ icon, text }: { icon: IconName; text: string }) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={34} color={t.border} />
      <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 19 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconBtn: { minWidth: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, flexDirection: 'row' },
  iconLabel: { fontSize: 12, marginLeft: 4, fontWeight: '600' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, height: 38, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 40, borderBottomWidth: 2 },
  badge: { marginLeft: 5, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginRight: 6, marginBottom: 6 },
  section: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 12, marginBottom: 6 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 28 },
  tooltipContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  tooltipBubble: {
    position: 'absolute',
    zIndex: 999999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    pointerEvents: 'none',
    ...Platform.select({
      web: {
        boxShadow: '0 3px 5px rgba(0, 0, 0, 0.35)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
        elevation: 8,
      },
    }),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  tooltipBottom: {
    top: 42,
  },
  tooltipTop: {
    bottom: 42,
  },
  tooltipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
