import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme, radius, radiusSm } from './theme';

function useStyles() {
  const { theme } = useTheme();
  return useMemo(() => makeStyles(theme), [theme]);
}

// Sombra "soft UI" de doble fuente: oscura abajo/derecha + luz arriba/izquierda.
// En web usa la sombra doble exacta de la guía; en nativo cae a una sombra suave.
const shadowCss = (dark, light, level) => {
  const d = level === 1 ? '4px 4px 10px' : level === 2 ? '8px 8px 18px' : '14px 16px 32px';
  const l = level === 1 ? '-4px -4px 10px' : level === 2 ? '-7px -7px 18px' : '-10px -10px 26px';
  return `${d} ${dark}, ${l} ${light}`;
};

const softShadow = (t, level = 1) =>
  Platform.OS === 'web'
    ? { boxShadow: shadowCss(t.shadowDark, t.shadowLight, level) }
    : {
        shadowColor: t.shadowDark,
        shadowOffset: { width: 0, height: level },
        shadowOpacity: 1,
        shadowRadius: level * 6,
        elevation: level,
      };

// Relieve interior al presionar (estado activo de la guía).
const pressedShadow = (t) =>
  Platform.OS === 'web'
    ? { boxShadow: `inset 3px 3px 8px ${t.shadowDark}, inset -3px -3px 8px ${t.shadowLight}` }
    : { opacity: 0.85 };

export function Screen({ children, scroll = true, style }) {
  const styles = useStyles();
  if (!scroll) {
    return <View style={[styles.screen, style]}>{children}</View>;
  }
  return (
    <ScrollView
      style={styles.screenScroll}
      contentContainerStyle={[styles.screen, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function Header({ title, subtitle, onBack, right }) {
  const styles = useStyles();
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      ) : null}
      <View style={styles.headerBody}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', disabled, small, style, icon }) {
  const { theme } = useTheme();
  const styles = useStyles();
  const bg =
    variant === 'primary'
      ? theme.accent
      : variant === 'danger'
      ? theme.danger
      : variant === 'ghost'
      ? theme.card
      : 'transparent';
  const border = variant === 'ghost' ? theme.line : 'transparent';
  const fg =
    variant === 'primary'
      ? theme.accentInk
      : variant === 'danger'
      ? theme.dangerInk
      : theme.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: border, borderWidth: variant === 'ghost' ? 1 : 0 },
        variant !== 'ghost' && softShadow(theme, 1),
        small && styles.btnSmall,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.btnText, { color: fg }, small && styles.btnTextSmall]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, autoCapitalize, autoFocus, style }) {
  const { theme } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.fieldWrap, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'sentences'}
        autoFocus={autoFocus}
        style={[styles.field, multiline && styles.fieldMultiline]}
      />
    </View>
  );
}

export function Card({ children, onPress, style, right }) {
  const styles = useStyles();
  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.cardMain}>{children}</View>
      {right ? <View style={styles.cardRight}>{right}</View> : null}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }
  return content;
}

export function EmptyState({ title, subtitle, emoji }) {
  const styles = useStyles();
  return (
    <View style={styles.empty}>
      {emoji ? <Text style={styles.emptyEmoji}>{emoji}</Text> : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Spinner({ label }) {
  const { theme } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.spinnerWrap}>
      <ActivityIndicator color={theme.accent} size="large" />
      {label ? <Text style={styles.spinnerLabel}>{label}</Text> : null}
    </View>
  );
}

export function Badge({ children, tone = 'neutral', style }) {
  const { theme } = useTheme();
  const styles = useStyles();
  const bg =
    tone === 'accent' ? theme.accentSoft : tone === 'danger' ? theme.dangerSoft : tone === 'warn' ? theme.warnSoft : theme.line;
  const fg =
    tone === 'accent' ? theme.accent : tone === 'danger' ? theme.danger : tone === 'warn' ? theme.warn : theme.muted;
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.badgeText, { color: fg }]}>{children}</Text>
    </View>
  );
}

export function Sheet({ visible, onClose, children, title }) {
  const styles = useStyles();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
        {children}
      </View>
    </Modal>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    screen: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8, flexGrow: 1 },
    screenScroll: { flex: 1, backgroundColor: t.bg },

    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.line },
    backText: { fontSize: 26, lineHeight: 28, color: t.ink, marginTop: -2 },
    headerBody: { flex: 1, minWidth: 0 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: t.ink, letterSpacing: -0.3 },
    headerSubtitle: { fontSize: 13, color: t.muted, marginTop: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16, minHeight: 50 },
    btnSmall: { paddingVertical: 9, paddingHorizontal: 14, minHeight: 40, borderRadius: 12 },
    btnText: { fontSize: 16, fontWeight: '700' },
    btnTextSmall: { fontSize: 14 },
    btnDisabled: { opacity: 0.45 },
    pressed: pressedShadow(t),

    fieldWrap: { marginBottom: 14 },
    fieldLabel: { fontSize: 13, fontWeight: '700', color: t.muted, marginBottom: 6 },
    field: { backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: radiusSm, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: t.ink },
    fieldMultiline: { minHeight: 220, textAlignVertical: 'top', paddingTop: 14 },

    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: radius, padding: 18, marginBottom: 12, ...softShadow(t, 2) },
    cardMain: { flex: 1, minWidth: 0 },
    cardRight: { marginLeft: 10 },

    empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
    emptyEmoji: { fontSize: 40, marginBottom: 10 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: t.ink, textAlign: 'center' },
    emptySubtitle: { fontSize: 14, color: t.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },

    spinnerWrap: { alignItems: 'center', paddingVertical: 40 },
    spinnerLabel: { color: t.muted, marginTop: 12, fontSize: 14 },

    badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
    badgeText: { fontSize: 12, fontWeight: '700' },

    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: { backgroundColor: t.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 36, ...(Platform.OS === 'web' ? { maxWidth: 520, alignSelf: 'center', width: '100%', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 24 } : {}) },
    sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: t.line, alignSelf: 'center', marginBottom: 16 },
    sheetTitle: { fontSize: 18, fontWeight: '800', color: t.ink, marginBottom: 14 },
  });
