import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { listGroups, createGroup, joinGroup, getProfile } from '../supabase';
import { useTheme } from '../theme';
import { Button, Card, EmptyState, Field, Header, Sheet, Spinner, Badge } from '../ui';
import ThemePicker from '../ThemePicker';

export default function HomeScreen({ onOpenGroup, onSignOut, session }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [groups, setGroups] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sheet, setSheet] = useState(null); // 'create' | 'join' | null
  const [themeOpen, setThemeOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [g, p] = await Promise.all([listGroups(), getProfile()]);
      setGroups(g);
      setProfile(p);
    } catch (e) {
      setGroups([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const g = await createGroup(name);
      setName('');
      setSheet(null);
      await refresh();
      onOpenGroup(g);
    } catch (e) {
      setError(e.message || 'No se pudo crear. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const g = await joinGroup(code);
      setCode('');
      setSheet(null);
      await refresh();
      onOpenGroup(g);
    } catch (e) {
      setError(e.message || 'Revisa el código.');
    } finally {
      setBusy(false);
    }
  }

  const email = (session && session.user && session.user.email) || '';
  const display = (profile && profile.display_name) || email.split('@')[0] || '';

  return (
    <View style={styles.root}>
      <Header
        title="Mis grupos"
        subtitle={email || ''}
        right={
          <View style={styles.headerBtns}>
            <Button title="Tema" variant="ghost" small onPress={() => setThemeOpen(true)} />
            <Button title="Salir" variant="ghost" small onPress={onSignOut} />
          </View>
        }
      />

      <View style={styles.actions}>
        <Button title="+ Crear grupo" onPress={() => setSheet('create')} style={styles.actionBtn} />
        <Button title="Unirse con código" variant="ghost" onPress={() => setSheet('join')} style={styles.actionBtn} />
      </View>

      {groups === null ? (
        <Spinner label="Cargando tus grupos…" />
      ) : groups.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="Aún no tienes grupos"
          subtitle="Crea uno e invita a alguien con el código, o únete con un código que te hayan compartido."
        />
      ) : (
        <View>
          <Text style={styles.sectionTitle}>
            Hola{display ? ', ' + display : ''} · {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
          </Text>
          {groups.map(({ group, memberCount }) => (
            <Card
              key={group.id}
              onPress={() => onOpenGroup(group)}
              right={<Text style={styles.chevron}>›</Text>}
            >
              <View style={styles.groupRow}>
                <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
                <View style={styles.groupMeta}>
                  <Badge tone="accent">{memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}</Badge>
                  <Badge>Código {group.invite_code}</Badge>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      <Sheet
        visible={sheet === 'create'}
        onClose={() => setSheet(null)}
        title="Nuevo grupo"
      >
        <Field
          label="Nombre del grupo"
          value={name}
          onChangeText={setName}
          placeholder="Ej: Casa, Trabajo, Viaje…"
          autoFocus
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={busy ? 'Creando…' : 'Crear grupo'} onPress={handleCreate} disabled={busy || !name.trim()} />
      </Sheet>

      <Sheet
        visible={sheet === 'join'}
        onClose={() => setSheet(null)}
        title="Unirse a un grupo"
      >
        <Text style={styles.help}>Pídele el código a quien creó el grupo.</Text>
        <Field
          label="Código de invitación"
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="ABC12345"
          autoCapitalize="characters"
          autoFocus
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={busy ? 'Uniéndote…' : 'Unirme'} onPress={handleJoin} disabled={busy || !code.trim()} />
      </Sheet>

      <ThemePicker visible={themeOpen} onClose={() => setThemeOpen(false)} />
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    headerBtns: { flexDirection: 'row', gap: 6 },
    actions: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    actionBtn: { flex: 1 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: t.muted, marginBottom: 8 },
    groupRow: { gap: 6 },
    groupName: { fontSize: 17, fontWeight: '800', color: t.ink },
    groupMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    chevron: { fontSize: 26, color: t.muted, marginLeft: 4 },
    help: { fontSize: 14, color: t.muted, marginBottom: 14, lineHeight: 20 },
    error: { color: t.danger, fontSize: 14, marginBottom: 12 },
  });
