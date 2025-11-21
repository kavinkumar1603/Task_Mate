import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function UserDashboard() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);



  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'home-outline' as const },
    { id: 'given', title: 'Given Tasks', icon: 'clipboard-outline' as const },
    { id: 'completed', title: 'Completed Tasks', icon: 'checkmark-done-outline' as const },
    { id: 'settings', title: 'Settings', icon: 'settings-outline' as const },
    { id: 'logout', title: 'Logout', icon: 'log-out-outline' as const },
  ];

  // Separate function for Dashboard
  const handleOpenDashboard = () => {
    router.push('/(tabs)/dashboard');
  };

  // Separate function for Given Tasks
  const handleOpenGivenTasks = () => {
    router.push('/(tabs)/given-tasks');
  };

  // Separate function for Completed Tasks
  const handleOpenCompletedTasks = () => {
    router.push('/(tabs)/completed-tasks');
  };

  // Separate function for Settings
  const handleOpenSettings = () => {
    router.push('/(tabs)/settings');
  };

  // Separate function for Logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  // Handler to call appropriate function based on button id
  const handleButtonPress = (id: string) => {
    switch (id) {
      case 'dashboard':
        handleOpenDashboard();
        break;
      case 'given':
        handleOpenGivenTasks();
        break;
      case 'completed':
        handleOpenCompletedTasks();
        break;
      case 'settings':
        handleOpenSettings();
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello there</Text>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* Menu Items */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.menuCard,
              pressed && styles.menuCardPressed,
              item.id === 'logout' && styles.logoutCard,
            ]}
            onPress={() => handleButtonPress(item.id)}
            android_ripple={{ color: item.id === 'logout' ? '#dc262620' : '#3b82f620' }}
            disabled={loading}
          >
            <View style={[
              styles.iconContainer,
              item.id === 'logout' && styles.logoutIconContainer
            ]}>
              <Ionicons 
                name={item.icon} 
                size={28} 
                color={item.id === 'logout' ? '#dc2626' : '#3b82f6'} 
              />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[
                styles.menuTitle,
                item.id === 'logout' && styles.logoutText
              ]}>
                {item.title}
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={item.id === 'logout' ? '#dc2626' : '#94a3b8'} 
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  menuContainer: {
    padding: 20,
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 16,
  },
  menuCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  logoutCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIconContainer: {
    backgroundColor: '#fee2e2',
  },
  menuTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  logoutText: {
    color: '#dc2626',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
