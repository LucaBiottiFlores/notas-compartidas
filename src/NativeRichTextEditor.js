import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import {
  useEditorBridge,
  useBridgeState,
  useEditorContent,
  RichText,
} from '@10play/tentap-editor';
import { useTheme } from './theme';

const TEXT_COLORS = ['#1B1C1E', '#E5484D', '#E8590C', '#E8A13A', '#1F7A4D', '#1971C2', '#6741D9'];
const HIGHLIGHT_COLORS = ['#FFF3B0', '#C7F0C1', '#FFD6D6', '#D6E4FF'];

function TB({ label, active, disabled, onPress, styles }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.tb, active && styles.tbActive, disabled && styles.tbDisabled]}
    >
      <Text style={[styles.tbText, active && styles.tbTextActive, disabled && styles.tbTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

function Swatch({ color, active, onPress, styles }) {
  return (
    <Pressable onPress={onPress} style={[styles.swatch, { backgroundColor: color }, active && styles.swatchActive]}>
      <Text style={styles.swatchLetter}>A</Text>
    </Pressable>
  );
}

export default function NativeRichTextEditor({ initialHtml, onChange }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: initialHtml || '',
    theme: { webview: { backgroundColor: theme.card } },
  });

  const state = useBridgeState(editor);
  const html = useEditorContent(editor, { type: 'html' });

  useEffect(() => {
    if (html !== undefined && onChangeRef.current) {
      onChangeRef.current(html);
    }
  }, [html]);

  useEffect(() => {
    const css = `
      * { background-color: ${theme.card}; color: ${theme.ink}; }
      blockquote { border-left: 3px solid ${theme.line}; padding-left: 1rem; color: ${theme.muted}; }
    `;
    editor.injectCSS(css, 'notas-theme');
  }, [editor, theme]);

  function clearFormatting() {
    if (state.isBoldActive) editor.toggleBold();
    if (state.isItalicActive) editor.toggleItalic();
    if (state.isUnderlineActive) editor.toggleUnderline();
    if (state.isStrikeActive) editor.toggleStrike();
    if (state.activeColor) editor.unsetColor();
    if (state.activeHighlight) editor.unsetHighlight();
  }

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolbar}
        keyboardShouldPersistTaps="handled"
      >
        <TB styles={styles} label="↺" disabled={!state.canUndo} onPress={() => editor.undo()} />
        <TB styles={styles} label="↻" disabled={!state.canRedo} onPress={() => editor.redo()} />

        <View style={styles.sep} />

        <TB styles={styles} label="B" active={!!state.isBoldActive} onPress={() => editor.toggleBold()} />
        <TB styles={styles} label="I" active={!!state.isItalicActive} onPress={() => editor.toggleItalic()} />
        <TB styles={styles} label="U" active={!!state.isUnderlineActive} onPress={() => editor.toggleUnderline()} />
        <TB styles={styles} label="S" active={!!state.isStrikeActive} onPress={() => editor.toggleStrike()} />

        <View style={styles.sep} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatchRow} nestedScrollEnabled>
          {TEXT_COLORS.map((c) => (
            <Swatch key={c} styles={styles} color={c} active={state.activeColor === c} onPress={() => editor.setColor(c)} />
          ))}
        </ScrollView>

        <View style={styles.sep} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatchRow} nestedScrollEnabled>
          {HIGHLIGHT_COLORS.map((c) => (
            <Swatch key={c} styles={styles} color={c} active={state.activeHighlight === c} onPress={() => editor.toggleHighlight(c)} />
          ))}
        </ScrollView>

        <View style={styles.sep} />

        <TB styles={styles} label="• Lista" active={!!state.isBulletListActive} onPress={() => editor.toggleBulletList()} wide />
        <TB styles={styles} label="1. Lista" active={!!state.isOrderedListActive} onPress={() => editor.toggleOrderedList()} wide />
        <TB styles={styles} label="Cita" active={!!state.isBlockquoteActive} onPress={() => editor.toggleBlockquote()} wide />
        <TB styles={styles} label="Código" active={!!state.isCodeActive} onPress={() => editor.toggleCode()} wide />

        <View style={styles.sep} />

        <TB styles={styles} label="Limpiar" onPress={clearFormatting} wide />
      </ScrollView>

      <View style={styles.editorShell}>
        <RichText editor={editor} style={styles.webview} />
      </View>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root: { gap: 8, marginBottom: 14 },
    toolbar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
    tb: {
      minWidth: 34,
      height: 34,
      paddingHorizontal: 8,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.line,
    },
    tbDisabled: { opacity: 0.35 },
    tbActive: { backgroundColor: t.accentSoft, borderColor: t.accent },
    tbText: { fontSize: 14, fontWeight: '700', color: t.ink },
    tbTextActive: { color: t.accent },
    tbTextDisabled: { color: t.muted },
    sep: { width: 1, height: 22, backgroundColor: t.line, marginHorizontal: 2 },
    swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    swatch: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: 'rgba(128,128,128,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchActive: { borderWidth: 2, borderColor: t.ink },
    swatchLetter: { fontSize: 12, fontWeight: '800', color: '#fff' },
    editorShell: {
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: 16,
      backgroundColor: t.card,
      overflow: 'hidden',
    },
    webview: { minHeight: 240, backgroundColor: t.card },
  });
