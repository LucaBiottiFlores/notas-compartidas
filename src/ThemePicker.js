import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, THEME_KEYS, THEMES } from './theme';
import { Sheet } from './ui';

export default function ThemePicker({ visible, onClose }) {
  const { themeKey, theme, setThemeKey } = useTheme();

  return (
    <Sheet visible={visible} onClose={onClose} title="Apariencia">
      <View style={styles.list}>
        {THEME_KEYS.map((k) => {
          const t = THEMES[k];
          const active = k === themeKey;
          return (
            <Pressable
              key={k}
              onPress={() => setThemeKey(k)}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: active ? theme.accentSoft : theme.card, borderColor: active ? theme.accent : theme.line },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.swatch, { backgroundColor: t.accent, borderColor: t.card }]} />
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.ink }]}>{t.label}</Text>
                <Text style={[styles.mode, { color: theme.muted }]}>{t.mode === 'dark' ? 'Oscuro' : 'Claro'}</Text>
              </View>
              {active ? <Text style={[styles.check, { color: theme.accentInk }]}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '700' },
  mode: { fontSize: 12, marginTop: 2 },
  check: { fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.85 },
});
