import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ltmdsxnhjbwmlldnfblh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bWRzeG5oamJ3bWxsZG5mYmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NTUwNDAsImV4cCI6MjEwNDUzMTA0MH0.ewJ-mAW1w5CT2sVuuGYXDj0DUKQecpsUrsb9eJQNLjw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// ---- Auth ----
export async function signIn(email) {
  const redirectTo =
    typeof window !== 'undefined' && window.location
      ? window.location.origin + window.location.pathname
      : 'notascompartidas://auth';
  return supabase.auth.signInWithOtp({
    email: (email || '').trim().toLowerCase(),
    options: { emailRedirectTo: redirectTo },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function getSession() {
  return supabase.auth.getSession();
}

export function onAuthChange(cb) {
  return supabase.auth.onAuthStateChange((_event, session) => cb(session));
}

export async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data && data.user ? data.user.id : null;
}

// ---- Perfil ----
export async function getProfile() {
  const id = await currentUserId();
  if (!id) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .eq('id', id)
    .maybeSingle();
  return data;
}

export async function setDisplayName(display_name) {
  const id = await currentUserId();
  if (!id) return null;
  return supabase.from('profiles').update({ display_name }).eq('id', id);
}

// ---- Grupos ----
export async function listGroups() {
  const { data: memberships, error } = await supabase
    .from('group_members')
    .select('group_id, role, groups(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const groups = (memberships || [])
    .map((m) => m.groups)
    .filter(Boolean)
    .map((g) => ({ group: g, memberCount: 1 }));

  const ids = groups.map((x) => x.group.id);
  if (ids.length) {
    const { data: allMembers } = await supabase
      .from('group_members')
      .select('group_id')
      .in('group_id', ids);
    const counts = {};
    (allMembers || []).forEach((m) => {
      counts[m.group_id] = (counts[m.group_id] || 0) + 1;
    });
    groups.forEach((x) => {
      x.memberCount = counts[x.group.id] || 1;
    });
  }
  return groups;
}

export async function createGroup(name) {
  const id = await currentUserId();
  if (!id) throw new Error('Sin sesión');
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name: (name || '').trim(), owner_id: id })
    .select()
    .single();
  if (error) throw error;
  await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: id, role: 'owner' });
  return group;
}

export async function joinGroup(code) {
  const clean = (code || '').trim().toUpperCase();
  if (!clean) throw new Error('Ingresa un código');
  const { data, error } = await supabase.rpc('join_group_by_code', {
    p_code: clean,
  });
  if (error) throw error;
  if (!data) throw new Error('Código no válido');
  return data;
}

export async function listMembers(groupId) {
  const { data: memberships, error } = await supabase
    .from('group_members')
    .select('id, role, user_id')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = memberships || [];
  const ids = rows.map((m) => m.user_id);
  const profileMap = {};
  if (ids.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .in('id', ids);
    (profiles || []).forEach((p) => {
      profileMap[p.id] = p;
    });
  }
  return rows.map((m) => ({
    id: m.id,
    role: m.role,
    user_id: m.user_id,
    profiles: profileMap[m.user_id] || null,
  }));
}

export async function leaveGroup(groupId) {
  const id = await currentUserId();
  if (!id) return null;
  return supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', id);
}

export async function deleteGroup(groupId) {
  const id = await currentUserId();
  if (!id) throw new Error('Sin sesión');

  // Solo el dueño puede borrar el grupo completo.
  const { data: g } = await supabase
    .from('groups')
    .select('owner_id')
    .eq('id', groupId)
    .maybeSingle();
  if (!g) throw new Error('Grupo no encontrado');
  if (g.owner_id !== id) throw new Error('Solo el dueño puede borrar el grupo');

  // Borrar versiones de notas, luego notas, miembros y por último el grupo.
  const { data: notes } = await supabase
    .from('notes')
    .select('id')
    .eq('group_id', groupId);
  const noteIds = (notes || []).map((n) => n.id);
  if (noteIds.length) {
    await supabase.from('note_versions').delete().in('note_id', noteIds);
    await supabase.from('notes').delete().eq('group_id', groupId);
  }
  await supabase.from('group_members').delete().eq('group_id', groupId);
  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) throw error;
  return true;
}

// ---- Notas ----
export async function listNotes(groupId, includeDeleted = false) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('group_id', groupId)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  if (includeDeleted) {
    return (data || []).filter((n) => n.deleted_at != null);
  }
  return (data || []).filter((n) => n.deleted_at == null);
}

export async function createNote(groupId, title, body) {
  const id = await currentUserId();
  if (!id) throw new Error('Sin sesión');
  const { data, error } = await supabase
    .from('notes')
    .insert({ group_id: groupId, author_id: id, title, body })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveNoteVersion(noteId, title, body, editedBy) {
  return supabase
    .from('note_versions')
    .insert({ note_id: noteId, title, body, edited_by: editedBy });
}

export async function updateNote(noteId, patch) {
  const { data, error } = await supabase
    .from('notes')
    .update(patch)
    .eq('id', noteId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteNote(noteId) {
  return supabase
    .from('notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', noteId);
}

export async function restoreNote(noteId) {
  return supabase.from('notes').update({ deleted_at: null }).eq('id', noteId);
}

export async function hardDeleteNote(noteId) {
  return supabase.from('notes').delete().eq('id', noteId);
}

export async function listVersions(noteId) {
  const { data, error } = await supabase
    .from('note_versions')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

// Suscripción en tiempo real a las notas de un grupo.
export function subscribeToGroupNotes(groupId, cb) {
  return supabase
    .channel('notes:' + groupId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notes', filter: 'group_id=eq.' + groupId },
      (payload) => cb(payload)
    )
    .subscribe();
}
