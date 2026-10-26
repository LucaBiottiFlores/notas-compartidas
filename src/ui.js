import React from 'react';
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
import { colors, radius, radiusSm } from './theme';

export function Screen({ children, scroll = true, style }) {
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
  const bg =
    variant === 'primary'
      ? colors.accent
      : variant === 'danger'
      ? colors.danger
      : variant === 'ghost'
      ? colors.card
      : 'transparent';
  const border = variant === 'ghost' ? colors.line : 'transparent';
  const fg = variant === 'primary' || variant === 'danger' ? '#fff' : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: border, borderWidth: variant === 'ghost' ? 1 : 0 },
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
  return (
    <View style={[styles.fieldWrap, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
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
  return (
    <View style={styles.empty}>
      {emoji ? <Text style={styles.emptyEmoji}>{emoji}</Text> : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Spinner({ label }) {
  return (
    <View style={styles.spinnerWrap}>
      <ActivityIndicator color={colors.accent} size="large" />
      {label ? <Text style={styles.spinnerLabel}>{label}</Text> : null}
    </View>
  );
}

export function Badge({ children, tone = 'neutral', style }) {
  const bg =
    tone === 'accent' ? colors.accentSoft : tone === 'danger' ? colors.dangerSoft : tone === 'warn' ? colors.warnSoft : colors.line;
  const fg =
    tone === 'accent' ? colors.accent : tone === 'danger' ? colors.danger : tone === 'warn' ? colors.warn : colors.muted;
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.badgeText, { color: fg }]}>{children}</Text>
    </View>
  );
}

export function Sheet({ visible, onClose, children, title }) {
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

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8, flexGrow: 1 },
  screenScroll: { flex: 1, backgroundColor: colors.bg },

  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  backText: { fontSize: 26, lineHeight: 28, color: colors.ink, marginTop: -2 },
  headerBody: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: colors.muted, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, minHeight: 50 },
  btnSmall: { paddingVertical: 9, paddingHorizontal: 14, minHeight: 38, borderRadius: 11 },
  btnText: { fontSize: 16, fontWeight: '700' },
  btnTextSmall: { fontSize: 14 },
  btnDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.muted, marginBottom: 6 },
  field: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radiusSm, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: colors.ink },
  fieldMultiline: { minHeight: 220, textAlignVertical: 'top', paddingTop: 14 },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius, padding: 16, marginBottom: 10 },
  cardMain: { flex: 1, minWidth: 0 },
  cardRight: { marginLeft: 10 },

  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  spinnerWrap: { alignItems: 'center', paddingVertical: 40 },
  spinnerLabel: { color: colors.muted, marginTop: 12, fontSize: 14 },

  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 36, ...(Platform.OS === 'web' ? { maxWidth: 520, alignSelf: 'center', width: '100%', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 24 } : {}) },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 14 },
});
