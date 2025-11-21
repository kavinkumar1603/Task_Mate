import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Extension {
  oldDeadline: string;
  newDeadline: string;
  extendedBy: string;
  extendedAt: string;
}

export default function EditTaskPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { taskId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    deadline: '',
    status: 'pending' as const,
    assignedToName: '',
  });

  const [newDeadline, setNewDeadline] = useState('');
  const [extensions, setExtensions] = useState<Extension[]>([]);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      if (!taskId || typeof taskId !== 'string') return;

      const docRef = doc(db, 'tasks', taskId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setTaskData({
          title: data.title || '',
          description: data.description || '',
          deadline: data.deadline || '',
          status: data.status || 'pending',
          assignedToName: data.assignedToName || '',
        });
        setNewDeadline(data.deadline || '');
        setExtensions(data.extensions || []);
      } else {
        Alert.alert('Error', 'Task not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Error', 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!taskData.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return false;
    }
    return true;
  };

  const validateDeadline = () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newDeadline)) {
      Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD');
      return false;
    }
    return true;
  };

  const handleSaveTask = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      if (!taskId || typeof taskId !== 'string') return;

      const updates: any = {
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        updatedAt: new Date().toISOString(),
      };

      // Check if deadline changed - add to extensions
      if (newDeadline && newDeadline !== taskData.deadline) {
        if (!validateDeadline()) {
          setSaving(false);
          return;
        }

        const extension: Extension = {
          oldDeadline: taskData.deadline,
          newDeadline: newDeadline,
          extendedBy: user?.userId || 'unknown',
          extendedAt: new Date().toISOString(),
        };

        updates.deadline = newDeadline;
        updates.extensions = arrayUnion(extension);
      }

      await updateDoc(doc(db, 'tasks', taskId), updates);

      Alert.alert('Success', 'Task updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading task...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Task</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}>
        
        {/* Task Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={taskData.title}
              onChangeText={(text) => setTaskData({ ...taskData, title: text })}
              placeholder="Task title"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={taskData.description}
              onChangeText={(text) => setTaskData({ ...taskData, description: text })}
              placeholder="Task description"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned To:</Text>
            <Text style={styles.infoValue}>{taskData.assignedToName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(taskData.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(taskData.status) }]}>
                {taskData.status.replace('-', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Extend Deadline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time" size={18} color="#3b82f6" /> Extend Deadline
          </Text>
          
          <View style={styles.deadlineCard}>
            <View style={styles.deadlineRow}>
              <Text style={styles.deadlineLabel}>Current Deadline:</Text>
              <Text style={styles.deadlineValue}>{formatDate(taskData.deadline)}</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>New Deadline</Text>
              <TextInput
                style={styles.input}
                value={newDeadline}
                onChangeText={setNewDeadline}
                placeholder="YYYY-MM-DD (e.g., 2025-12-31)"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.helpText}>Format: YYYY-MM-DD</Text>
            </View>

            {newDeadline !== taskData.deadline && newDeadline && (
              <View style={styles.changeIndicator}>
                <Ionicons name="arrow-forward" size={16} color="#3b82f6" />
                <Text style={styles.changeText}>
                  Deadline will change to: {formatDate(newDeadline)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Extension History */}
        {extensions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Extension History</Text>
            {extensions.map((ext, index) => (
              <View key={index} style={styles.extensionCard}>
                <View style={styles.extensionHeader}>
                  <Ionicons name="time-outline" size={16} color="#64748b" />
                  <Text style={styles.extensionDate}>
                    {formatDate(ext.extendedAt)}
                  </Text>
                </View>
                <Text style={styles.extensionText}>
                  {formatDate(ext.oldDeadline)} → {formatDate(ext.newDeadline)}
                </Text>
                <Text style={styles.extensionBy}>Extended by: {ext.extendedBy}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveTask}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'in-progress': return '#8b5cf6';
    case 'completed': return '#10b981';
    default: return '#94a3b8';
  }
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
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  helpText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deadlineCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  deadlineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  deadlineValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
    flex: 1,
  },
  extensionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  extensionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  extensionDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  extensionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  extensionBy: {
    fontSize: 12,
    color: '#64748b',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
