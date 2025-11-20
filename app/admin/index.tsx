import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const router = useRouter();

  const menuItems = [
    { id: 'dashboard', title: 'Admin Dashboard', icon: 'grid-outline' as const, route: '/admin/dashboard' },
    { id: 'users', title: 'Manage Users', icon: 'people-outline' as const, route: '/admin/users' },
    { id: 'tasks', title: 'View All Tasks', icon: 'list-outline' as const, route: '/admin/tasks' },
    { id: 'create', title: 'Create Task', icon: 'add-circle-outline' as const, route: '/admin/create-task' },
    { id: 'profile', title: 'Admin Profile / Settings', icon: 'person-circle-outline' as const, route: '/admin/profile' },
    { id: 'logout', title: 'Logout', icon: 'log-out-outline' as const, route: '/login' },
  ];

  const handleNavigation = (route: string, id: string) => {
    if (id === 'logout') {
      // TODO: Clear auth/session
      router.replace('/login');
    } else {
      // Placeholder navigation - uncomment when routes are ready
      console.log(`Navigating to: ${route}`);
      // router.push(route);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.role}>Administrator</Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>
      </View>

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
            onPress={() => handleNavigation(item.route, item.id)}
            android_ripple={{ color: item.id === 'logout' ? '#dc262620' : '#3b82f620' }}
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
  role: {
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
});
``