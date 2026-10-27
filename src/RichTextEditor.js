import React, { useEffect, useRef, useReducer } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { colors } from './theme';

// Mark `textStyle` extendido: soporta color y tamaño de letra en un mismo mark,
// para no chocar con la extensión `Color` de TipTap.
const TextStyleExt = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      color: {
        default: null,
        parseHTML: (element) => element.style.color || null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return { style: `color: ${attributes.color}` };
        },
      },
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { color, fontSize, ...rest } = HTMLAttributes;
    const styles = [];
    if (color) styles.push(`color: ${color}`);
    if (fontSize) styles.push(`font-size: ${fontSize}`);
    const base = { ...(this.options.HTMLAttributes || {}) };
    delete base.style;
    const merged = { ...base, ...rest };
    if (styles.length) merged.style = styles.join('; ');
    return ['span', merged, 0];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setColor: (color) => ({ chain }) => chain().setMark('textStyle', { color }).run(),
      unsetColor: () => ({ chain }) => chain().setMark('textStyle', { color: null }).run(),
      setFontSize: (fontSize) => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

const EXTENSIONS = [
  StarterKit,
  Underline,
  TextStyleExt,
  Highlight.configure({ multicolor: true }),
  Placeholder.configure({ placeholder: 'Escribe lo que necesites…' }),
];

const TEXT_COLORS = ['#1B1C1E', '#E5484D', '#E8590C', '#E8A13A', '#1F7A4D', '#1971C2', '#6741D9'];
const HIGHLIGHT_COLORS = ['#FFF3B0', '#C7F0C1', '#FFD6D6', '#D6E4FF'];
const FONT_SIZES = [
  { label: 'A−', size: '0.85em' },
  { label: 'A', size: '1em' },
  { label: 'A+', size: '1.25em' },
  { label: 'A++', size: '1.5em' },
];

function ensureCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('tiptap-css')) return;
  const style = document.createElement('style');
  style.id = 'tiptap-css';
  style.textContent = `
    .tiptap.ProseMirror {
      min-height: 220px;
      padding: 14px 16px;
      outline: none;
      font-size: 16px;
      line-height: 1.55;
      color: ${colors.ink};
    }
    .tiptap.ProseMirror p { margin: 0 0 0.6em; }
    .tiptap.ProseMirror h1 { font-size: 1.6em; font-weight: 800; margin: 0.6em 0 0.35em; }
    .tiptap.ProseMirror h2 { font-size: 1.35em; font-weight: 800; margin: 0.55em 0 0.3em; }
    .tiptap.ProseMirror h3 { font-size: 1.15em; font-weight: 700; margin: 0.5em 0 0.25em; }
    .tiptap.ProseMirror ul, .tiptap.ProseMirror ol { padding-left: 1.4em; margin: 0 0 0.6em; }
    .tiptap.ProseMirror ul { list-style: disc; }
    .tiptap.ProseMirror ol { list-style: decimal; }
    .tiptap.ProseMirror blockquote {
      border-left: 3px solid ${colors.line};
      margin: 0.6em 0;
      padding-left: 0.9em;
      color: ${colors.muted};
    }
    .tiptap.ProseMirror code {
      background: ${colors.bg};
      border-radius: 5px;
      padding: 0.15em 0.4em;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.9em;
    }
    .tiptap.ProseMirror pre {
      background: #F0EFEA;
      border-radius: 10px;
      padding: 12px 14px;
      overflow-x: auto;
      margin: 0.6em 0;
    }
    .tiptap.ProseMirror pre code { background: transparent; padding: 0; }
    .tiptap.ProseMirror a { color: ${colors.accent}; }
    .tiptap.ProseMirror p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      color: ${colors.muted};
      float: left;
      height: 0;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

function TB({ label, active, onPress, children, wide }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tb, wide && styles.tbWide, active && styles.tbActive]}
    >
      {children || <Text style={[styles.tbText, active && styles.tbTextActive]}>{label}</Text>}
    </Pressable>
  );
}

function Swatch({ color, active, onPress, isText }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.swatch,
        isText && styles.swatchText,
        { backgroundColor: color },
        active && styles.swatchActive,
      ]}
    >
      {isText ? <Text style={styles.swatchLetter}>A</Text> : null}
    </Pressable>
  );
}

export default function RichTextEditor({ initialHtml, onChange }) {
  const contentRef = useRef(initialHtml || '');
  const onChangeRef = useRef(onChange);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    ensureCss();
  }, []);

  const editor = useEditor(
    {
      extensions: EXTENSIONS,
      content: contentRef.current,
      onUpdate: ({ editor: e }) => {
        if (onChangeRef.current) onChangeRef.current(e.getHTML());
      },
      editorProps: {
        attributes: { class: 'tiptap' },
      },
    },
    []
  );

  useEffect(() => {
    if (!editor) return;
    const update = () => forceUpdate();
    editor.on('transaction', update);
    editor.on('selectionUpdate', update);
    return () => {
      editor.off('transaction', update);
      editor.off('selectionUpdate', update);
    };
  }, [editor]);

  if (!editor) {
    return (
      <View style={[styles.shell, styles.emptyShell]}>
        <Text style={styles.emptyText}>Cargando editor…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolbar}
        keyboardShouldPersistTaps="handled"
      >
        <TB label="↺" onPress={() => editor.chain().focus().undo().run()} active={false} />
        <TB label="↻" onPress={() => editor.chain().focus().redo().run()} active={false} />

        <View style={styles.sep} />

        <TB
          label="B"
          onPress={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        />
        <TB
          label="I"
          onPress={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        />
        <TB
          label="U"
          onPress={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
        />
        <TB
          label="S"
          onPress={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
        />

        <View style={styles.sep} />

        {FONT_SIZES.map((f) => (
          <TB
            key={f.size}
            label={f.label}
            onPress={() => editor.chain().focus().setFontSize(f.size).run()}
            active={editor.isActive('textStyle', { fontSize: f.size })}
          />
        ))}

        <View style={styles.sep} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatchRow} nestedScrollEnabled>
          {TEXT_COLORS.map((c) => (
            <Swatch
              key={c}
              color={c}
              isText
              active={editor.isActive('textStyle', { color: c })}
              onPress={() => editor.chain().focus().setColor(c).run()}
            />
          ))}
        </ScrollView>

        <View style={styles.sep} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatchRow} nestedScrollEnabled>
          {HIGHLIGHT_COLORS.map((c) => (
            <Swatch
              key={c}
              color={c}
              active={editor.isActive('highlight', { color: c })}
              onPress={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
            />
          ))}
        </ScrollView>

        <View style={styles.sep} />

        <TB
          label="• Lista"
          onPress={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          wide
        />
        <TB
          label="1. Lista"
          onPress={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          wide
        />
        <TB
          label="Cita"
          onPress={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          wide
        />
        <TB
          label="Código"
          onPress={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          wide
        />

        <View style={styles.sep} />

        <TB
          label="Limpiar"
          onPress={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          active={false}
          wide
        />
      </ScrollView>

      <View style={styles.shell}>
        <EditorContent editor={editor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  tb: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tbWide: { minWidth: 'auto' },
  tbActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  tbText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  tbTextActive: { color: colors.accent },
  sep: { width: 1, height: 22, backgroundColor: colors.line, marginHorizontal: 2 },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchText: { width: 22, height: 22, borderRadius: 11 },
  swatchActive: { borderWidth: 2, borderColor: colors.ink },
  swatchLetter: { fontSize: 12, fontWeight: '800', color: '#fff' },
  shell: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  emptyShell: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.muted, fontSize: 14 },
});
