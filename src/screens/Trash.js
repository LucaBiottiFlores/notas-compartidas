import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { listNotes, restoreNote, hardDeleteNote } from '../supabase';
import { colors } from '../theme';
import { Button, Card, EmptyState, Header, Sheet, Spinner } from '../ui';

function fmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
}

export default function TrashScreen({ group, onBack, onRestored }) {
  const [notes, setNotes] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const n = await listNotes(group.id, true);
      setNotes(n);
    } catch (e) {
      setNotes([]);
    }
  }, [group.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRestore(id) {
    await restoreNote(id);
    await refresh();
    if (onRestored) onRestored();
  }

  async function handleHardDelete() {
    const id = confirmId;
    setConfirmId(null);
    await hardDeleteNote(id);
    await refresh();
    if (onRestored) onRestored();
  }

  return (
    <View style={styles.root}>
      <Header title="Papelera" subtitle={group.name} onBack={onBack} />

      {notes === null ? (
        <Spinner label="Cargando papelera…" />
      ) : notes.length === 0 ? (
        <EmptyState
          emoji="🧹"
          title="Papelera vacía"
          subtitle="Cuando borres una nota, quedará aquí para que puedas restaurarla. Solo se elimina de verdad si tú lo decides."
        />
      ) : (
        <View>
          <Text style={styles.hint}>
            {notes.length} {notes.length === 1 ? 'nota eliminada' : 'notas eliminadas'} · se conservan hasta que las borres definitivamente.
          </Text>
          {notes.map((n) => (
            <Card key={n.id}>
              <View style={styles.note}>
                <Text style={styles.noteTitle} numberOfLines={1}>{n.title || 'Nota sin título'}</Text>
                <Text style={styles.noteTime}>Eliminada el {fmt(n.deleted_at)}</Text>
              </View>
              <View style={styles.actionsCol}>
                <Button title="Restaurar" small onPress={() => handleRestore(n.id)} />
                <Button title="Borrar" variant="danger" small onPress={() => setConfirmId(n.id)} />
              </View>
            </Card>
          ))}
        </View>
      )}

      <Sheet visible={confirmId != null} onClose={() => setConfirmId(null)} title="¿Borrar para siempre?">
        <Text style={styles.confirmText}>
          Esta acción no se puede deshacer. La nota y su historial se eliminarán definitivamente.
        </Text>
        <View style={styles.confirmRow}>
          <Button title="Cancelar" variant="ghost" onPress={() => setConfirmId(null)} style={styles.confirmBtn} />
          <Button title="Borrar para siempre" variant="danger" onPress={handleHardDelete} style={styles.confirmBtn} />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hint: { fontSize: 13, color: colors.muted, marginBottom: 10 },
  note: { gap: 3 },
  noteTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  noteTime: { fontSize: 12, color: colors.muted },
  actionsCol: { gap: 8, alignItems: 'flex-end' },
  confirmText: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 18 },
  confirmRow: { flexDirection: 'row', gap: 10 },
  confirmBtn: { flex: 1 },
});
