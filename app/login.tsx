import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  const userIdValid = useMemo(() => userId.trim().length > 0, [userId]);
  const passwordValid = useMemo(() => password.length >= 6, [password]);
  const canSubmit = userIdValid && passwordValid;

  const onSignIn = () => {
    // Placeholder for Firebase sign-in. Navigate to tabs after success.
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.container}>
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <Text style={styles.brand}>task<Text style={styles.brandAccent}>flow</Text></Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>User ID</Text>
          <View style={[styles.inputWrapper, !userIdValid && userId.length > 0 ? styles.inputError : null]}>
            <Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={userId}
              onChangeText={setUserId}
              placeholder="your_user_id"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="default"
              returnKeyType="next"
              textContentType="username"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputWrapper, !passwordValid && password.length > 0 ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry={secure}
              textContentType="password"
            />
            <Pressable onPress={() => setSecure(s => !s)} style={styles.eyeButton} hitSlop={10}>
              <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={20} color="#475569" />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={onSignIn}
          disabled={!canSubmit}
          android_ripple={{ color: '#ffffff33' }}
          style={({ pressed }) => [
            styles.primaryButton,
            !canSubmit && styles.primaryButtonDisabled,
            pressed && canSubmit ? styles.primaryButtonPressed : null,
          ]}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </Pressable>

        <Pressable>
          <Text style={styles.linkMuted}>Forgot password?</Text>
        </Pressable>
      </Animated.View>

      <StatusBar style="dark" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
    alignItems: 'stretch',
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'lowercase',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  brandAccent: {
    color: Colors.light.tint,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    color: '#5b6472',
    marginTop: 6,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 6,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
  },
  inputError: {
    borderColor: '#fca5a5',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#0f172a',
  },
  eyeButton: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  primaryButton: {
    marginTop: 8,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  primaryButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkMuted: {
    
    textAlign: 'center',
    marginTop: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  blobTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#0a7ea410',
  },
  blobBottom: {
    position: 'absolute',
    bottom: -120,
    left: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#0a7ea408',
  },
});
