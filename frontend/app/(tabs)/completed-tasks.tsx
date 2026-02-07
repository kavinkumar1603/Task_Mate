import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types';

export default function CompletedTasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadCompletedTasks();
  }, []);

  const loadCompletedTasks = async () => {
    try {
      setLoading(true);

      if (!user) {
        return;
      }

      // Load tasks from API
      const tasksData = await api.get(`/tasks?assignedTo=${user.userId}&status=completed`);

      // Sort by completion date (newest first)
      tasksData.sort((a: Task, b: Task) => {
        if (!a.completedAt) return 1;
        if (!b.completedAt) return -1;
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      });

      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading completed tasks:', error);
      Alert.alert('Error', 'Failed to load completed tasks');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      {/* Task Header */}
      <View style={styles.taskHeader}>
        <View style={styles.checkmarkIcon}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
        </View>
        <View style={styles.taskHeaderContent}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.completedDate}>
            Completed on {formatDate(item.completedAt || '')}
          </Text>
        </View>
      </View>

      {/* Description */}
      {item.description && (
        <Text style={styles.taskDescription} numberOfLines={3}>
          {item.description}
        </Text>
      )}

      {/* Meta Info */}
      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Deadline</Text>
          <Text style={styles.metaValue}>
            {item.deadline ? formatDate(item.deadline) : 'No deadline'}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Completed At</Text>
          <Text style={styles.metaValue}>
            {item.completedAt ? formatTime(item.completedAt) : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Duration/Status */}
      {item.createdAt && item.completedAt && (
        <View style={styles.durationBadge}>
          <Ionicons name="time" size={14} color="#64748b" />
          <Text style={styles.durationText}>
            Completed in{' '}
            {Math.ceil(
              (new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
            )}{' '}
            days
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>Completed Tasks</Text>
        <Pressable onPress={loadCompletedTasks} style={styles.refreshButton}>
          <Ionicons name="reload" size={20} color="#10b981" />
        </Pressable>
      </View>

      {/* Task Count */}
      <View style={styles.countBadge}>
        <Ionicons name="checkmark-done" size={18} color="#10b981" />
        <Text style={styles.countText}>{tasks.length} Completed Tasks</Text>
      </View>

      {/* Tasks List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading completed tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="clipboard" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Completed Tasks</Text>
              <Text style={styles.emptyText}>
                Tasks you complete will appear here
              </Text>
            </View>
          }
        />
      )}
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  listContent: {
    padding: 20,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkmarkIcon: {
    marginRight: 12,
  },
  taskHeaderContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  completedDate: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
    paddingLeft: 36,
  },
  metaGrid: {
    flexDirection: 'row',
    paddingLeft: 36,
    marginBottom: 12,
    gap: 24,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginLeft: 36,
  },
  durationText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
