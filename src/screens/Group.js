import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { listNotes, listMembers, subscribeToGroupNotes, deleteGroup, currentUserId } from '../supabase';
import { useTheme } from '../theme';
import { Button, Card, EmptyState, Header, Sheet, Spinner, Badge } from '../ui';
import { htmlToText } from '../utils';

function timeAgo(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return 'hace ' + min + ' min';
  const h = Math.floor(min / 60);
  if (h < 24) return 'hace ' + h + ' h';
  const d = Math.floor(h / 24);
  if (d === 1) return 'ayer';
  if (d < 7) return 'hace ' + d + ' días';
  const dt = new Date(iso);
  return dt.getDate() + '/' + (dt.getMonth() + 1) + '/' + dt.getFullYear();
}

function snippet(body, n = 90) {
  const s = htmlToText(body).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default function GroupScreen({ group, onBack, onOpenNote, onOpenTrash, onEditedName }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [notes, setNotes] = useState(null);
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const n = await listNotes(group.id);
      setNotes(n);
    } catch (e) {
      setNotes([]);
    }
    try {
      const m = await listMembers(group.id);
      setMembers(m);
    } catch (e) {
      setMembers([]);
    }
  }, [group.id]);

  useEffect(() => {
    refresh();
    const channel = subscribeToGroupNotes(group.id, () => refresh());
    return () => {
      if (channel && channel.unsubscribe) channel.unsubscribe();
    };
  }, [refresh, group.id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const uid = await currentUserId();
      if (mounted) setIsOwner(uid === group.owner_id);
    })();
    return () => {
      mounted = false;
    };
  }, [group.owner_id]);

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function copyCode() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(group.invite_code);
      }
    } catch (e) {}
    notify('Código ' + group.invite_code + ' listo para compartir');
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteGroup(group.id);
      setConfirmDelete(false);
      onBack();
    } catch (e) {
      setDeleting(false);
      setConfirmDelete(false);
      notify(e.message || 'No se pudo borrar el grupo');
    }
  }

  const active = notes || [];
  const memberCount = members.length || 1;

  return (
    <View style={styles.root}>
      <Header
        title={group.name}
        subtitle={'Código ' + group.invite_code + ' · ' + memberCount + ' ' + (memberCount === 1 ? 'miembro' : 'miembros')}
        onBack={onBack}
        right={<Button title="Papelera" variant="ghost" small onPress={onOpenTrash} />}
      />

      <View style={styles.actions}>
        <Button title="+ Nueva nota" onPress={() => onOpenNote(null)} style={styles.actionBtn} />
        <Button title="Miembros" variant="ghost" onPress={() => setShowMembers(true)} style={styles.actionBtn} />
      </View>

      {notes === null ? (
        <Spinner label="Cargando notas…" />
      ) : active.length === 0 ? (
        <EmptyState
          emoji="🗒️"
          title="Sin notas todavía"
          subtitle="Crea la primera nota. Todo lo que escribas aquí lo verán al instante las otras personas del grupo."
        />
      ) : (
        <View>
          {active.map((n) => (
            <Card key={n.id} onPress={() => onOpenNote(n)} right={<Text style={styles.chevron}>›</Text>}>
              <View style={styles.noteTop}>
                <Text style={styles.noteTitle} numberOfLines={1}>
                  {n.title || 'Nota sin título'}
                </Text>
                {n.pinned ? <Badge tone="warn">Fijada</Badge> : null}
              </View>
              {n.body ? <Text style={styles.noteSnippet} numberOfLines={2}>{snippet(n.body)}</Text> : null}
              <Text style={styles.noteTime}>{timeAgo(n.updated_at)}</Text>
            </Card>
          ))}
        </View>
      )}

      {/* Miembros */}
      <Sheet visible={showMembers} onClose={() => setShowMembers(false)} title="Miembros del grupo">
        <View style={styles.memberList}>
          {members.map((m) => {
            const p = m.profiles || {};
            const name = p.display_name || (p.email || '').split('@')[0] || 'Miembro';
            return (
              <View key={m.id} style={styles.memberRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(name[0] || '?').toUpperCase()}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName} numberOfLines={1}>{name}</Text>
                  {p.email ? <Text style={styles.memberEmail} numberOfLines={1}>{p.email}</Text> : null}
                </View>
                {m.role === 'owner' ? <Badge tone="accent">Dueño</Badge> : null}
              </View>
            );
          })}
        </View>
        <Button title="Copiar código de invitación" onPress={copyCode} />
        {isOwner ? (
          <Button
            title="Borrar grupo"
            variant="danger"
            style={styles.deleteBtn}
            onPress={() => setConfirmDelete(true)}
          />
        ) : null}
      </Sheet>

      {/* Confirmación de borrado */}
      <Sheet visible={confirmDelete} onClose={() => setConfirmDelete(false)} title="¿Borrar este grupo?">
        <Text style={styles.confirmText}>
          Se borrará el grupo «{group.name}» junto con todas sus notas y el historial. Esta acción no se puede deshacer.
        </Text>
        <Button
          title={deleting ? 'Borrando…' : 'Sí, borrar grupo'}
          variant="danger"
          onPress={handleDelete}
          disabled={deleting}
        />
        <Button
          title="Cancelar"
          variant="ghost"
          style={styles.cancelBtn}
          onPress={() => setConfirmDelete(false)}
          disabled={deleting}
        />
      </Sheet>

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    actions: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    actionBtn: { flex: 1 },
    noteTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    noteTitle: { fontSize: 16, fontWeight: '800', color: t.ink, flexShrink: 1 },
    noteSnippet: { fontSize: 14, color: t.muted, lineHeight: 20 },
    noteTime: { fontSize: 12, color: t.muted, marginTop: 6 },
    chevron: { fontSize: 26, color: t.muted, marginLeft: 4 },
    memberList: { marginBottom: 16 },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.line },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 17, fontWeight: '800', color: t.accent },
    memberInfo: { flex: 1, minWidth: 0 },
    memberName: { fontSize: 15, fontWeight: '700', color: t.ink },
    memberEmail: { fontSize: 13, color: t.muted },
    deleteBtn: { marginTop: 12 },
    confirmText: { fontSize: 14, color: t.muted, lineHeight: 20, marginBottom: 16 },
    cancelBtn: { marginTop: 10 },
    toast: { position: 'absolute', left: 24, right: 24, bottom: 28, backgroundColor: t.ink, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
    toastText: { color: t.bg, fontSize: 14, fontWeight: '600' },
  });
