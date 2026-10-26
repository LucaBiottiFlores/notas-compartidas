import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { listNotes, listMembers, subscribeToGroupNotes } from '../supabase';
import { colors } from '../theme';
import { Button, Card, EmptyState, Header, Sheet, Spinner, Badge } from '../ui';

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
  const s = (body || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default function GroupScreen({ group, onBack, onOpenNote, onOpenTrash, onEditedName }) {
  const [notes, setNotes] = useState(null);
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [n, m] = await Promise.all([listNotes(group.id), listMembers(group.id)]);
      setNotes(n);
      setMembers(m);
    } catch (e) {
      setNotes([]);
    }
  }, [group.id]);

  useEffect(() => {
    refresh();
    const channel = subscribeToGroupNotes(group.id, () => refresh());
    return () => {
      if (channel && channel.unsubscribe) channel.unsubscribe();
    };
  }, [refresh, group.id]);

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
      </Sheet>

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  actionBtn: { flex: 1 },
  noteTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  noteTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, flexShrink: 1 },
  noteSnippet: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  noteTime: { fontSize: 12, color: colors.muted, marginTop: 6 },
  chevron: { fontSize: 26, color: colors.muted, marginLeft: 4 },
  memberList: { marginBottom: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '800', color: colors.accent },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  memberEmail: { fontSize: 13, color: colors.muted },
  toast: { position: 'absolute', left: 24, right: 24, bottom: 28, backgroundColor: colors.ink, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
