import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

export default function LandingScreen() {
  const router = useRouter();

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  const handleGetStarted = () => {
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      {/* subtle decorative blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <Text style={styles.title}>
          Task<Text style={styles.titleAccent}>flow</Text>
        </Text>
        <Text style={styles.subtitle}>Organize tasks. Move faster.</Text>

        <Pressable
          onPress={handleGetStarted}
          android_ripple={{ color: '#ffffff33' }}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </Animated.View>

      <StatusBar style="dark" />
    </View>
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
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  titleAccent: {
    color: Colors.light.tint,
  },
  subtitle: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 28,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  blobTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#0a7ea410',
  },
  blobBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#0a7ea408',
  },
});
