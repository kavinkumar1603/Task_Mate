import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { Employee } from '@/types';

type SidebarBadgeMap = { [key: string]: number | undefined };

type SidebarProps = {
  visible?: boolean; // used for overlay variant
  variant?: 'overlay' | 'persistent';
  onClose?: () => void;
  employee?: Employee | null;
  activeKey?: string;
  badges?: SidebarBadgeMap;
  onNavigate?: (key: string) => void;
  onLogout: () => void;
  onDashboard: () => void; // retained for backwards compatibility
};

export default function Sidebar({
  visible = true,
  variant = 'overlay',
  onClose,
  employee,
  activeKey = 'dashboard',
  badges = {},
  onNavigate,
  onLogout,
  onDashboard,
}: SidebarProps) {
  const initial = employee?.name?.charAt(0).toUpperCase() ?? 'U';

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', action: () => onDashboard() },
    { key: 'tasks', label: 'Tasks', icon: 'list-outline', action: () => onNavigate && onNavigate('tasks') },
    { key: 'employees', label: 'Employees', icon: 'people-outline', action: () => onNavigate && onNavigate('employees') },
    { key: 'settings', label: 'Settings', icon: 'settings-outline', action: () => onNavigate && onNavigate('settings') },
  ];

  // Slide animation for overlay
  const slideAnim = useRef(new Animated.Value(-300)).current;
  useEffect(() => {
    if (variant === 'overlay') {
      Animated.timing(slideAnim, {
        toValue: visible ? 0 : -300,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, variant, slideAnim]);

  if (variant === 'persistent') {
    return (
      <View style={styles.panelPersistent}>
        <View style={styles.brandRow}>
          <Ionicons name="layers" size={20} color="#60a5fa" />
          <Text style={styles.brandText}>Task Flow</Text>
        </View>
        <View style={styles.header}>
          <View style={styles.avatar}> 
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText} numberOfLines={1}>{employee?.name || 'User'}</Text>
            {!!employee?.userId && <Text style={styles.metaText}>ID: {employee.userId}</Text>}
            {!!employee?.department && <Text style={styles.metaText}>{employee.department}</Text>}
          </View>
        </View>
        <View style={styles.menuGroup}>
          {menuItems.map(item => {
            const active = activeKey === item.key;
            return (
              <Pressable
                key={item.key}
                style={[styles.darkItem, active && styles.darkItemActive]}
                onPress={item.action}
              >
                <Ionicons name={item.icon as any} size={20} color={active ? '#cbd5e1' : '#94a3b8'} />
                <Text style={[styles.darkLabel, active && styles.darkLabelActive]}>{item.label}</Text>
                {badges[item.key] !== undefined && badges[item.key]! > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badges[item.key]}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.logoutContainer}>
          <Pressable style={styles.logoutRow} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#f87171" />
            <Text style={styles.logoutLabel}>Logout</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.panelDark, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.header}>
          <View style={styles.avatar}> 
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText} numberOfLines={1}>{employee?.name || 'User'}</Text>
            {!!employee?.userId && <Text style={styles.metaText}>ID: {employee.userId}</Text>}
            {!!employee?.department && <Text style={styles.metaText}>{employee.department}</Text>}
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#94a3b8" />
          </Pressable>
        </View>
        <View style={styles.menuGroup}>
          {menuItems.map(item => {
            const active = activeKey === item.key;
            return (
              <Pressable
                key={item.key}
                style={[styles.darkItem, active && styles.darkItemActive]}
                onPress={() => { item.action(); onClose && onClose(); }}
              >
                <Ionicons name={item.icon as any} size={20} color={active ? '#cbd5e1' : '#94a3b8'} />
                <Text style={[styles.darkLabel, active && styles.darkLabelActive]}>{item.label}</Text>
                {badges[item.key] !== undefined && badges[item.key]! > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badges[item.key]}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.logoutContainer}>
          <Pressable style={styles.logoutRow} onPress={() => { onLogout(); onClose && onClose(); }}>
            <Ionicons name="log-out-outline" size={20} color="#f87171" />
            <Text style={styles.logoutLabel}>Logout</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0 as unknown as number,
    width: '100%',
    height: '100%',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panelDark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 300,
    backgroundColor: '#111827',
    paddingTop: 48,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  panelPersistent: {
    width: 240,
    backgroundColor: '#ffffff',
    paddingTop: 32,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  menuGroup: {
    marginBottom: 28,
  },
  darkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  darkItemActive: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  darkLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
    flex: 1,
    marginLeft: 14,
  },
  darkLabelActive: {
    color: '#f1f5f9',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutContainer: {
    marginTop: 'auto',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fca5a5',
  },
});
