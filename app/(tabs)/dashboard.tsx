import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface Stats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  completionRate: number;
}

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    completionRate: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      if (!user) {
        return;
      }

      // Load stats from API
      const statsData = await api.get(`/dashboard/stats?userId=${user.userId}`);

      setStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>My Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="person" size={12} color="#8b5cf6" />
              <Text style={styles.roleText}>User</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Tasks"
            value={stats.totalTasks}
            icon="briefcase"
            color="#3b82f6"
          />
          <StatCard
            title="Pending"
            value={stats.pendingTasks}
            icon="time"
            color="#f59e0b"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgressTasks}
            icon="sync"
            color="#8b5cf6"
          />
          <StatCard
            title="Completed"
            value={stats.completedTasks}
            icon="checkmark-circle"
            color="#10b981"
          />
        </View>

        {/* Completion Rate */}
        <View style={styles.completionCard}>
          <View style={styles.completionHeader}>
            <Ionicons name="stats-chart" size={24} color="#3b82f6" />
            <Text style={styles.completionTitle}>Completion Rate</Text>
          </View>
          <View style={styles.completionContent}>
            <Text style={styles.completionRate}>{stats.completionRate}%</Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${stats.completionRate}%` }]}
              />
            </View>
            <Text style={styles.completionText}>
              {stats.completedTasks} of {stats.totalTasks} tasks completed
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/given-tasks' as any)}>
            <View style={styles.actionButtonContent}>
              <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="list" size={24} color="#3b82f6" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>View Given Tasks</Text>
                <Text style={styles.actionSubtitle}>
                  {stats.pendingTasks + stats.inProgressTasks} active tasks
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/completed-tasks' as any)}>
            <View style={styles.actionButtonContent}>
              <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="checkmark-done" size={24} color="#10b981" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Completed Tasks</Text>
                <Text style={styles.actionSubtitle}>
                  {stats.completedTasks} tasks completed
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCard: {
    width: '50%',
    padding: 6,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  statTitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    marginLeft: 6,
    fontWeight: '600',
  },
  completionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  completionContent: {
    alignItems: 'center',
  },
  completionRate: {
    fontSize: 48,
    fontWeight: '800',
    color: '#3b82f6',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  completionText: {
    fontSize: 14,
    color: '#64748b',
  },
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
});
