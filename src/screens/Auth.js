import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { signIn } from '../supabase';
import { useTheme } from '../theme';
import { Button, Field } from '../ui';
import ThemePicker from '../ThemePicker';

export default function AuthScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [themeOpen, setThemeOpen] = useState(false);

  async function submit() {
    const clean = (email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      setError('Escribe un correo válido');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(clean);
    setLoading(false);
    if (err) {
      setError('No se pudo enviar el enlace. Revisa el correo o inténtalo de nuevo.');
    } else {
      setSent(true);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.mark}>
          <Text style={styles.markText}>N</Text>
        </View>
        <Text style={styles.title}>Notas Compartidas</Text>
        <Text style={styles.subtitle}>
          Apuntes rápidos en grupos, sincronizados en tiempo real. Sin cuentas engorrosas ni archivos sueltos.
        </Text>
      </View>

      {sent ? (
        <View style={styles.sentCard}>
          <Text style={styles.sentEmoji}>✉️</Text>
          <Text style={styles.sentTitle}>Revisa tu correo</Text>
          <Text style={styles.sentBody}>
            Te enviamos un enlace mágico a <Text style={styles.bold}>{email.trim().toLowerCase()}</Text>. Ábrelo para entrar.
          </Text>
          <Button title="Usar otro correo" variant="ghost" onPress={() => setSent(false)} />
        </View>
      ) : (
        <View style={styles.form}>
          <Field
            label="Tu correo"
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title={loading ? 'Enviando…' : 'Entrar con mi correo'} onPress={submit} disabled={loading} />
          <Text style={styles.legal}>
            Sin contraseña: entras con un enlace seguro que llega a tu correo. Tu sesión queda guardada en este dispositivo.
          </Text>
        </View>
      )}

      <Button title="Cambiar tema" variant="ghost" small onPress={() => setThemeOpen(true)} style={styles.themeBtn} />

      <ThemePicker visible={themeOpen} onClose={() => setThemeOpen(false)} />
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg, padding: 24, justifyContent: 'center' },
    hero: { alignItems: 'center', marginBottom: 30 },
    mark: { width: 72, height: 72, borderRadius: 20, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    markText: { color: t.accentInk, fontSize: 36, fontWeight: '800' },
    title: { fontSize: 28, fontWeight: '800', color: t.ink, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: t.muted, textAlign: 'center', lineHeight: 22, marginTop: 10, maxWidth: 340 },
    form: { maxWidth: 420, width: '100%', alignSelf: 'center' },
    error: { color: t.danger, fontSize: 14, marginBottom: 12, textAlign: 'center' },
    legal: { fontSize: 12, color: t.muted, textAlign: 'center', marginTop: 16, lineHeight: 18 },
    sentCard: { backgroundColor: t.card, borderRadius: 20, borderWidth: 1, borderColor: t.line, padding: 24, alignItems: 'center', maxWidth: 420, width: '100%', alignSelf: 'center' },
    sentEmoji: { fontSize: 40, marginBottom: 10 },
    sentTitle: { fontSize: 20, fontWeight: '800', color: t.ink },
    sentBody: { fontSize: 15, color: t.muted, textAlign: 'center', lineHeight: 22, marginVertical: 12 },
    bold: { fontWeight: '700', color: t.ink },
    themeBtn: { alignSelf: 'center', marginTop: 24 },
  });
