import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  createNote,
  updateNote,
  saveNoteVersion,
  softDeleteNote,
  listVersions,
  currentUserId,
} from '../supabase';
import { useTheme } from '../theme';
import { Button, Field, Header, Sheet } from '../ui';
import RichTextEditor from '../RichTextEditor';
import NativeRichTextEditor from '../NativeRichTextEditor';
import { htmlToText } from '../utils';

function fmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function NoteEditorScreen({ group, note, onBack, onSaved }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [title, setTitle] = useState(note ? note.title || '' : '');
  const [body, setBody] = useState(note ? note.body || '' : '');
  const [noteId, setNoteId] = useState(note ? note.id : null);
  const [pinned, setPinned] = useState(note ? !!note.pinned : false);
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [history, setHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const lastSaved = useRef({ title: title, body: body });
  const timer = useRef(null);

  const doSave = useCallback(
    async (t, b) => {
      if (!noteId) return;
      if (t === lastSaved.current.title && b === lastSaved.current.body) return;
      const prev = { ...lastSaved.current };
      setStatus('saving');
      try {
        const uid = await currentUserId();
        await saveNoteVersion(noteId, prev.title, prev.body, uid);
        await updateNote(noteId, { title: t, body: b });
        lastSaved.current = { title: t, body: b };
        setStatus('saved');
        if (onSaved) onSaved();
      } catch (e) {
        setStatus('error');
      }
    },
    [noteId, onSaved]
  );

  function scheduleSave(t, b) {
    if (!noteId) return;
    setStatus('idle');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => doSave(t, b), 900);
  }

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  function onTitle(t) {
    setTitle(t);
    scheduleSave(t, body);
  }
  function onBody(b) {
    setBody(b);
    scheduleSave(title, b);
  }

  async function handleCreate() {
    if (!title.trim() && !body.trim()) return;
    setCreating(true);
    try {
      const n = await createNote(group.id, title.trim(), body.trim());
      setNoteId(n.id);
      lastSaved.current = { title: n.title, body: n.body };
      setStatus('saved');
      if (onSaved) onSaved();
    } catch (e) {
      setStatus('error');
    } finally {
      setCreating(false);
    }
  }

  async function togglePin() {
    if (!noteId) return;
    const next = !pinned;
    setPinned(next);
    try {
      await updateNote(noteId, { pinned: next });
    } catch (e) {}
  }

  async function handleDelete() {
    setConfirmDelete(false);
    if (!noteId) {
      onBack();
      return;
    }
    try {
      await softDeleteNote(noteId);
      if (onSaved) onSaved();
      onBack();
    } catch (e) {}
  }

  async function openHistory() {
    if (!noteId) return;
    const v = await listVersions(noteId);
    setHistory(v);
    setShowHistory(true);
  }

  const isNew = !noteId;
  const statusLabel =
    status === 'saving' ? 'Guardando…' : status === 'saved' ? 'Guardado' : status === 'error' ? 'Error al guardar' : '';

  return (
    <View style={styles.root}>
      <Header
        title={isNew ? 'Nueva nota' : 'Nota'}
        subtitle={group.name}
        onBack={onBack}
        right={
          !isNew ? (
            <View style={styles.topActions}>
              <Button title={pinned ? 'Quitar fijado' : 'Fijar'} variant="ghost" small onPress={togglePin} />
            </View>
          ) : null
        }
      />

      <ScrollView
        style={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!isNew ? (
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>{statusLabel}</Text>
            <Button title="Historial" variant="ghost" small onPress={openHistory} />
          </View>
        ) : null}

        <Field
          label="Título"
          value={title}
          onChangeText={onTitle}
          placeholder="Título de la nota"
        />
        {Platform.OS === 'web' ? (
          <View style={styles.editorWrap}>
            <Text style={styles.editorLabel}>Contenido</Text>
            <RichTextEditor initialHtml={body} onChange={onBody} />
          </View>
        ) : (
          <View style={styles.editorWrap}>
            <Text style={styles.editorLabel}>Contenido</Text>
            <NativeRichTextEditor initialHtml={body} onChange={onBody} />
          </View>
        )}

        {isNew ? (
          <Button
            title={creating ? 'Creando…' : 'Crear nota'}
            onPress={handleCreate}
            disabled={creating || (!title.trim() && !body.trim())}
          />
        ) : (
          <Button title="Mover a papelera" variant="danger" onPress={() => setConfirmDelete(true)} />
        )}
      </ScrollView>

      {/* Confirmación de borrado */}
      <Sheet visible={confirmDelete} onClose={() => setConfirmDelete(false)} title="¿Mover a la papelera?">
        <Text style={styles.confirmText}>
          La nota no se elimina definitivamente: queda en la papelera del grupo y puedes restaurarla cuando quieras.
        </Text>
        <View style={styles.confirmRow}>
          <Button title="Cancelar" variant="ghost" onPress={() => setConfirmDelete(false)} style={styles.confirmBtn} />
          <Button title="Mover a papelera" variant="danger" onPress={handleDelete} style={styles.confirmBtn} />
        </View>
      </Sheet>

      {/* Historial de versiones */}
      <Sheet visible={showHistory} onClose={() => setShowHistory(false)} title="Historial de cambios">
        {history && history.length === 0 ? (
          <Text style={styles.confirmText}>Todavía no hay versiones anteriores guardadas.</Text>
        ) : (
          <ScrollView style={{ maxHeight: 380 }}>
            {(history || []).map((v) => (
              <View key={v.id} style={styles.versionRow}>
                <Text style={styles.versionTitle} numberOfLines={1}>{v.title || 'Nota sin título'}</Text>
                <Text style={styles.versionBody} numberOfLines={3}>{htmlToText(v.body)}</Text>
                <Text style={styles.versionTime}>{fmt(v.created_at)}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </Sheet>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    body: { flex: 1, paddingHorizontal: 20 },
    topActions: { flexDirection: 'row', gap: 6 },
    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    statusText: { fontSize: 13, color: t.muted, fontWeight: '600' },
    bottomRow: { flexDirection: 'column', gap: 10, marginTop: 8 },
    confirmText: { fontSize: 15, color: t.muted, lineHeight: 22, marginBottom: 18 },
    confirmRow: { flexDirection: 'row', gap: 10 },
    confirmBtn: { flex: 1 },
    versionRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.line },
    versionTitle: { fontSize: 15, fontWeight: '700', color: t.ink },
    versionBody: { fontSize: 14, color: t.muted, marginTop: 2, lineHeight: 19 },
    versionTime: { fontSize: 12, color: t.muted, marginTop: 6 },
    editorWrap: { marginBottom: 14 },
    editorLabel: { fontSize: 13, fontWeight: '700', color: t.muted, marginBottom: 6 },
  });
