import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getSession, onAuthChange, signOut } from './src/supabase';
import { colors } from './src/theme';
import { Spinner } from './src/ui';
import AuthScreen from './src/screens/Auth';
import HomeScreen from './src/screens/Home';
import GroupScreen from './src/screens/Group';
import NoteEditorScreen from './src/screens/NoteEditor';
import TrashScreen from './src/screens/Trash';

export default function App() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState({ name: 'home' });

  useEffect(() => {
    let mounted = true;
    getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data && data.session ? data.session : null);
      setBooting(false);
    });
    const sub = onAuthChange((s) => {
      setSession(s);
      if (!s) setRoute({ name: 'home' });
    });
    return () => {
      mounted = false;
      if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await signOut();
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <View style={styles.splash}>
          <Spinner label="Cargando…" />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <AuthScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      {route.name === 'home' ? (
        <HomeScreen
          session={session}
          onOpenGroup={(group) => setRoute({ name: 'group', group })}
          onSignOut={handleSignOut}
        />
      ) : route.name === 'group' ? (
        <GroupScreen
          group={route.group}
          onBack={() => setRoute({ name: 'home' })}
          onOpenNote={(note) => setRoute({ name: 'note', group: route.group, note })}
          onOpenTrash={() => setRoute({ name: 'trash', group: route.group })}
        />
      ) : route.name === 'note' ? (
        <NoteEditorScreen
          group={route.group}
          note={route.note}
          onBack={() => setRoute({ name: 'group', group: route.group })}
          onSaved={() => {}}
        />
      ) : route.name === 'trash' ? (
        <TrashScreen
          group={route.group}
          onBack={() => setRoute({ name: 'group', group: route.group })}
          onRestored={() => {}}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  splash: { flex: 1, justifyContent: 'center' },
});
