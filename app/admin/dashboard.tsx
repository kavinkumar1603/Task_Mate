import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch total users
      const usersRef = collection(db, 'employees');
      const usersQuery = query(usersRef, where('role', '==', 'user'));
      const usersSnapshot = await getDocs(usersQuery);
      const totalUsers = usersSnapshot.size;

      // Fetch all tasks
      const tasksRef = collection(db, 'tasks');
      const tasksSnapshot = await getDocs(tasksRef);
      const allTasks = tasksSnapshot.docs.map(doc => doc.data());

      const totalTasks = allTasks.length;
      const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
      const completedTasks = allTasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = allTasks.filter(t => t.status === 'in-progress').length;

      setStats({
        totalUsers,
        totalTasks,
        pendingTasks,
        completedTasks,
        inProgressTasks,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
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
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Total Users Card */}
          <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#3b82f6' }]}>
              <Ionicons name="people" size={28} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          {/* Total Tasks Card */}
          <View style={[styles.statCard, { backgroundColor: '#e0e7ff' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#6366f1' }]}>
              <Ionicons name="list" size={28} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.totalTasks}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>

          {/* Pending Tasks Card */}
          <View style={[styles.statCard, { backgroundColor: '#fed7aa' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#f59e0b' }]}>
              <Ionicons name="time" size={28} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.pendingTasks}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          {/* In Progress Card */}
          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#eab308' }]}>
              <Ionicons name="hourglass" size={28} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.inProgressTasks}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>

          {/* Completed Tasks Card */}
          <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#10b981' }]}>
              <Ionicons name="checkmark-circle" size={28} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          {/* Completion Rate Card */}
          <View style={[styles.statCard, { backgroundColor: '#f3e8ff' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#a855f7' }]}>
              <Ionicons name="stats-chart" size={28} color="#fff" />
            </View>
            <Text style={styles.statValue}>
              {stats.totalTasks > 0
                ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                : 0}
              %
            </Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/admin/manage-users')}>
            <View style={styles.actionButtonContent}>
              <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="people" size={24} color="#3b82f6" />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Manage Users</Text>
                <Text style={styles.actionSubtitle}>View and manage all users</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/admin/tasks')}>
            <View style={styles.actionButtonContent}>
              <View style={[styles.actionIcon, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="list" size={24} color="#6366f1" />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>View All Tasks</Text>
                <Text style={styles.actionSubtitle}>Manage all system tasks</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/admin/create-task')}>
            <View style={styles.actionButtonContent}>
              <View style={[styles.actionIcon, { backgroundColor: '#d1fae5' }]}>
                <Ionicons name="add-circle" size={24} color="#10b981" />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Create New Task</Text>
                <Text style={styles.actionSubtitle}>Assign task to users</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  section: {
    marginBottom: 24,
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
    shadowRadius: 3,
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
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
});
