import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function ViewAllTasksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, filterStatus]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksRef = collection(db, 'tasks');
      const snapshot = await getDocs(tasksRef);
      
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];

      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.assignedToName?.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'tasks', task.id));
              Alert.alert('Success', 'Task deleted successfully');
              await loadTasks();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const handleEditTask = (task: Task) => {
    router.push(`/admin/edit-task?taskId=${task.id}`);
  };

  const handleSaveEdit = async () => {
    if (!selectedTask || !editTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    try {
      const taskRef = doc(db, 'tasks', selectedTask.id);
      await updateDoc(taskRef, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });

      Alert.alert('Success', 'Task updated successfully');
      setEditModalVisible(false);
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleUpdateStatus = async (task: Task, newStatus: Task['status']) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.completedAt = new Date().toISOString();
      }

      await updateDoc(taskRef, updateData);
      Alert.alert('Success', `Task marked as ${newStatus}`);
      await loadTasks();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in-progress':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const renderTask = ({ item }: { item: Task }) => {
    const isOverdue = new Date(item.deadline) < new Date() && item.status !== 'completed';

    return (
      <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.taskMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="person" size={14} color="#64748b" />
            <Text style={styles.metaText}>{item.assignedToName || 'Unassigned'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar" size={14} color={isOverdue ? '#dc2626' : '#64748b'} />
            <Text style={[styles.metaText, isOverdue && styles.overdueText]}>
              {new Date(item.deadline).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.taskActions}>
          {item.status !== 'completed' && (
            <Pressable
              style={[styles.statusButton, styles.completeButton]}
              onPress={() => handleUpdateStatus(item, 'completed')}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.completeButtonText}>Complete</Text>
            </Pressable>
          )}
          
          <Pressable
            style={[styles.statusButton, styles.editButton]}
            onPress={() => handleEditTask(item)}>
            <Ionicons name="create" size={16} color="#3b82f6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>

          <Pressable
            style={[styles.statusButton, styles.deleteButton]}
            onPress={() => handleDeleteTask(item)}>
            <Ionicons name="trash" size={16} color="#dc2626" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Tasks...</Text>
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
        <Text style={styles.headerTitle}>All Tasks</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filteredTasks.length}</Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.controls}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          )}
        </View>

        <View style={styles.filterButtons}>
          {(['all', 'pending', 'in-progress', 'completed'] as const).map(status => (
            <Pressable
              key={status}
              style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
              onPress={() => setFilterStatus(status)}>
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive,
                ]}>
                {status === 'all' ? 'All' : status.replace('-', ' ')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Task</Text>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={28} color="#64748b" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Task title"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Task description"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSaveEdit}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    flex: 1,
    marginLeft: 12,
  },
  countBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  controls: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
  },
  overdueText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  completeButton: {
    backgroundColor: '#f0fdf4',
  },
  completeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  editButton: {
    backgroundColor: '#eff6ff',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
