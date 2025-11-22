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

export default function GivenTasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadGivenTasks();
  }, []);

  const loadGivenTasks = async () => {
    try {
      setLoading(true);

      if (!user) {
        return;
      }

      // Load tasks from API
      const tasksData = await api.get(`/tasks?assignedTo=${user.userId}&status=pending,in-progress`);

      // Sort by deadline
      tasksData.sort((a: Task, b: Task) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });

      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkInProgress = async (taskId: string) => {
    try {
      setProcessingTaskId(taskId);

      await api.put(`/tasks/${taskId}`, {
        status: 'in-progress',
        startedAt: new Date().toISOString(),
      });

      // Update local state
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? { ...task, status: 'in-progress' as const, startedAt: new Date().toISOString() }
            : task
        )
      );

      Alert.alert('Success', 'Task marked as in progress');
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task status');
    } finally {
      setProcessingTaskId(null);
    }
  };

  const handleMarkCompleted = async (taskId: string) => {
    Alert.alert(
      'Complete Task',
      'Mark this task as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setProcessingTaskId(taskId);

              await api.put(`/tasks/${taskId}`, {
                status: 'completed',
                completedAt: new Date().toISOString(),
              });

              // Remove from list
              setTasks(prev => prev.filter(task => task.id !== taskId));

              Alert.alert('Success', 'Task marked as completed!');
            } catch (error) {
              console.error('Error completing task:', error);
              Alert.alert('Error', 'Failed to complete task');
            } finally {
              setProcessingTaskId(null);
            }
          },
        },
      ]
    );
  };

  const isOverdue = (deadline: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'in-progress':
        return '#8b5cf6';
      case 'completed':
        return '#10b981';
      default:
        return '#94a3b8';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      {/* Task Header */}
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
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
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar" size={14} color="#64748b" />
          <Text style={styles.metaText}>
            {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline'}
          </Text>
        </View>
        {isOverdue(item.deadline) && (
          <View style={[styles.metaItem, { backgroundColor: '#fef2f2' }]}>
            <Ionicons name="warning" size={14} color="#dc2626" />
            <Text style={[styles.metaText, { color: '#dc2626' }]}>Overdue</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {item.status === 'pending' && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}
            onPress={() => handleMarkInProgress(item.id)}
            disabled={processingTaskId === item.id}>
            {processingTaskId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="play" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Start Task</Text>
              </>
            )}
          </Pressable>
        )}

        <Pressable
          style={[styles.actionButton, { backgroundColor: '#10b981' }]}
          onPress={() => handleMarkCompleted(item.id)}
          disabled={processingTaskId === item.id}>
          {processingTaskId === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Complete</Text>
            </>
          )}
        </Pressable>
      </View>
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
        <Text style={styles.headerTitle}>Given Tasks</Text>
        <Pressable onPress={loadGivenTasks} style={styles.refreshButton}>
          <Ionicons name="reload" size={20} color="#3b82f6" />
        </Pressable>
      </View>

      {/* Task Count */}
      <View style={styles.countBadge}>
        <Ionicons name="list" size={18} color="#3b82f6" />
        <Text style={styles.countText}>{tasks.length} Active Tasks</Text>
      </View>

      {/* Tasks List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
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
              <Ionicons name="checkmark-done-circle" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Active Tasks</Text>
              <Text style={styles.emptyText}>
                You don't have any pending or in-progress tasks
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
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
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
