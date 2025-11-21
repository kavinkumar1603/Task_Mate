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
import { useRouter } from 'expo-router';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Employee } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { notifyAssignedUser } from '@/utils/notifications';

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState<Employee[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    assignedToName: '',
    deadline: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const employeesRef = collection(db, 'employees');
      const q = query(employeesRef, where('role', '==', 'user'));
      const snapshot = await getDocs(q);
      
      const usersData = snapshot.docs.map(doc => ({
        userId: doc.id,
        ...doc.data(),
      })) as Employee[];

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (user: Employee) => {
    setTaskData({
      ...taskData,
      assignedTo: user.userId,
      assignedToName: user.name,
    });
    setShowUserDropdown(false);
    setSearchQuery('');
  };

  const validateForm = () => {
    if (!taskData.title.trim()) {
      Alert.alert('Error', 'Please enter task title');
      return false;
    }
    if (!taskData.assignedTo) {
      Alert.alert('Error', 'Please select a user to assign');
      return false;
    }
    if (!taskData.deadline) {
      Alert.alert('Error', 'Please enter deadline (YYYY-MM-DD)');
      return false;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(taskData.deadline)) {
      Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD');
      return false;
    }

    return true;
  };

  const handleCreateTask = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const task = {
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        assignedTo: taskData.assignedTo,
        assignedToName: taskData.assignedToName,
        deadline: taskData.deadline,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        createdBy: 'admin', // Should be actual admin ID from auth
      };

      const taskRef = await addDoc(collection(db, 'tasks'), task);

      // Send push notification to assigned user
      try {
        await notifyAssignedUser(
          taskData.assignedTo,
          taskData.title,
          taskRef.id
        );
        console.log('Push notification sent successfully');
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't show error to user - notification failure shouldn't block task creation
      }

      Alert.alert('Success', 'Task created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setTaskData({
              title: '',
              description: '',
              assignedTo: '',
              assignedToName: '',
              deadline: '',
            });
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Create New Task</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}>
        
        {/* Task Title */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task title"
            placeholderTextColor="#94a3b8"
            value={taskData.title}
            onChangeText={(text) => setTaskData({ ...taskData, title: text })}
          />
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter task description (optional)"
            placeholderTextColor="#94a3b8"
            value={taskData.description}
            onChangeText={(text) => setTaskData({ ...taskData, description: text })}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Assign To */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Assign To *</Text>
          <Pressable
            style={styles.dropdownButton}
            onPress={() => setShowUserDropdown(!showUserDropdown)}>
            <View style={styles.dropdownContent}>
              <Ionicons name="person" size={18} color="#64748b" />
              <Text
                style={[
                  styles.dropdownText,
                  !taskData.assignedToName && styles.placeholderText,
                ]}>
                {taskData.assignedToName || 'Select user'}
              </Text>
            </View>
            <Ionicons
              name={showUserDropdown ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#64748b"
            />
          </Pressable>

          {showUserDropdown && (
            <View style={styles.dropdown}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <ScrollView style={styles.userList} nestedScrollEnabled>
                {loadingUsers ? (
                  <ActivityIndicator size="small" color="#3b82f6" style={{ padding: 20 }} />
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <Pressable
                      key={user.userId}
                      style={[
                        styles.userItem,
                        taskData.assignedTo === user.userId && styles.userItemSelected,
                      ]}
                      onPress={() => handleSelectUser(user)}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {user.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userMeta}>
                          {user.userId} • {user.department || 'No dept'}
                        </Text>
                      </View>
                      {taskData.assignedTo === user.userId && (
                        <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                      )}
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No users found</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Deadline */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Deadline *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (e.g., 2025-12-31)"
            placeholderTextColor="#94a3b8"
            value={taskData.deadline}
            onChangeText={(text) => setTaskData({ ...taskData, deadline: text })}
          />
          <Text style={styles.helpText}>Format: YYYY-MM-DD</Text>
        </View>

        {/* Create Button */}
        <Pressable
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateTask}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Task</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  formGroup: {
    marginBottom: 24,
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownText: {
    fontSize: 15,
    color: '#0f172a',
  },
  placeholderText: {
    color: '#94a3b8',
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  userList: {
    maxHeight: 240,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userItemSelected: {
    backgroundColor: '#eff6ff',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  helpText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    fontStyle: 'italic',
  },
  createButton: {
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
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
