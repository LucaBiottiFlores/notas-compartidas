import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, StyleSheet, Text, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { getSession, onAuthChange, signOut, supabase } from './src/supabase';
import { ThemeProvider, useTheme } from './src/theme';
import { Spinner } from './src/ui';
import AuthScreen from './src/screens/Auth';
import HomeScreen from './src/screens/Home';
import GroupScreen from './src/screens/Group';
import NoteEditorScreen from './src/screens/NoteEditor';
import TrashScreen from './src/screens/Trash';

function extractAuthCode(url) {
  if (!url) return null;
  const m = /[?&#]code=([^&]+)/.exec(url);
  return m ? decodeURIComponent(m[1]) : null;
}

function AppShell() {
  const { theme } = useTheme();
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState({ name: 'home' });

  useEffect(() => {
    let mounted = true;

    async function handleUrl(url) {
      if (!url) return;
      const code = extractAuthCode(url);
      if (!code) return;
      try {
        await supabase.auth.exchangeCodeForSession(code);
      } catch (e) {
        // enlace ya usado o inválido: se ignora
      }
    }

    async function boot() {
      if (Platform.OS !== 'web') {
        try {
          const initialUrl = await Linking.getInitialURL();
          await handleUrl(initialUrl);
        } catch (e) {}
      }
      const { data } = await getSession();
      if (!mounted) return;
      setSession(data && data.session ? data.session : null);
      setBooting(false);
    }
    boot();

    let linkSub;
    if (Platform.OS !== 'web') {
      linkSub = Linking.addEventListener('url', ({ url }) => {
        handleUrl(url);
      });
    }

    const sub = onAuthChange((s) => {
      setSession(s);
      if (!s) setRoute({ name: 'home' });
    });

    return () => {
      mounted = false;
      if (linkSub) linkSub.remove();
      if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await signOut();
  }

  const styles = makeStyles(theme);

  if (booting) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
        <View style={styles.splash}>
          <Spinner label="Cargando…" />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
        <AuthScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
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

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    splash: { flex: 1, justifyContent: 'center' },
  });
