import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { collection, addDoc, getDocs, updateDoc, doc, getDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Task, Employee } from '@/types';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Employee | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');

  const filteredTasks = useMemo(() => {
    if (!taskSearch.trim()) return tasks;
    const q = taskSearch.toLowerCase();
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.assignedToName || '').toLowerCase().includes(q)
    );
  }, [tasks, taskSearch]);

  // Filtered employees based on search
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const search = searchQuery.toLowerCase();
    return employees.filter(
      emp =>
        emp.name.toLowerCase().includes(search) ||
        emp.userId.toLowerCase().includes(search) ||
        emp.department?.toLowerCase().includes(search)
    );
  }, [employees, searchQuery]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchAdminData(), fetchTasks(), fetchEmployees()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      // TODO: Get from auth context/AsyncStorage
      const adminId = 'ADMIN001';
      const adminRef = doc(db, 'employees', adminId);
      const snap = await getDoc(adminRef);
      if (snap.exists()) {
        setAdmin({ userId: snap.id, ...snap.data() } as Employee);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleLogout = () => {
    // TODO: Clear auth context/AsyncStorage
    router.replace('/login');
  };

  const fetchTasks = async () => {
    try {
      const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(tasksQuery);
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const empQuery = query(collection(db, 'employees'), where('role', '==', 'user'));
      const snapshot = await getDocs(empQuery);
      const empData = snapshot.docs.map(doc => ({
        userId: doc.id,
        ...doc.data(),
      })) as Employee[];
      setEmployees(empData);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.assignedTo || !newTask.deadline) {
      alert('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const selectedEmployee = employees.find(e => e.userId === newTask.assignedTo);
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        assignedTo: newTask.assignedTo,
        assignedToName: selectedEmployee?.name || 'Unknown',
        deadline: newTask.deadline,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        createdBy: 'admin', // Replace with actual admin ID from auth context
      };

      await addDoc(collection(db, 'tasks'), taskData);
      
      // Reset form and close modal
      setNewTask({ title: '', description: '', assignedTo: '', deadline: '' });
      setSearchQuery('');
      setShowEmployeeDropdown(false);
      setModalVisible(false);
      
      // Reload tasks
      await fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
      await fetchTasks();
    } catch (error) {
      console.error('Error marking task complete:', error);
      alert('Failed to update task');
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

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'in-progress':
        return 'time';
      default:
        return 'ellipse-outline';
    }
  };

  const renderTask = ({ item }: { item: Task }) => {
    const isOverdue = new Date(item.deadline) < new Date() && item.status !== 'completed';
    
    return (
      <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleRow}>
            <View style={[styles.statusIconCircle, { backgroundColor: getStatusColor(item.status) + '15' }]}> 
              <Ionicons
                name={getStatusIcon(item.status)}
                size={20}
                color={getStatusColor(item.status)}
              />
            </View>
            <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '18' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('-', ' ')}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.taskDescription} numberOfLines={3}>{item.description}</Text>
        ) : null}

        <View style={styles.taskFooterRow}>
          <View style={styles.taskMetaLeft}>
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={16} color="#64748b" />
              <Text style={styles.metaText}>{item.assignedToName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={isOverdue ? '#dc2626' : '#64748b'} />
              <Text style={[styles.metaText, isOverdue && styles.overdueText]}>
                {new Date(item.deadline).toLocaleDateString()}
              </Text>
            </View>
          </View>
          {item.status !== 'completed' && (
            <Pressable
              style={styles.inlineActionBtn}
              onPress={() => handleMarkComplete(item.id)}
              android_ripple={{ color: '#10b98120' }}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={styles.inlineActionText}>Complete</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Admin Profile Header */}
      {admin && (
        <View style={styles.profileHeader}>
          <View style={styles.profileLeft}>
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>{admin.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.adminName}>{admin.name}</Text>
              <Text style={styles.adminRole}>Administrator</Text>
            </View>
          </View>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      )}

      {/* Stats Overview */}
      <View style={styles.statsWrapper}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#3b82f6' }]}> 
              <Ionicons name="list" size={22} color="#fff" />
            </View>
            <View style={styles.statTextBlock}>
              <Text style={styles.statValue}>{tasks.length}</Text>
              <Text style={styles.statCaption}>Total</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#f59e0b' }]}> 
              <Ionicons name="time" size={22} color="#fff" />
            </View>
            <View style={styles.statTextBlock}>
              <Text style={styles.statValue}>{tasks.filter(t => t.status === 'pending').length}</Text>
              <Text style={styles.statCaption}>Pending</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#10b981' }]}> 
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
            </View>
            <View style={styles.statTextBlock}>
              <Text style={styles.statValue}>{tasks.filter(t => t.status === 'completed').length}</Text>
              <Text style={styles.statCaption}>Completed</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tasks List */}
      <View style={styles.tasksSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Tasks</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
            android_ripple={{ color: '#ffffff40' }}>
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.addButtonText}>New Task</Text>
          </Pressable>
        </View>

        {/* Task toolbar */}
        <View style={styles.taskToolbar}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color="#64748b" />
            <TextInput
              placeholder="Search tasks..."
              placeholderTextColor="#94a3b8"
              value={taskSearch}
              onChangeText={setTaskSearch}
              style={styles.taskSearchInput}
              returnKeyType="search"
            />
            {taskSearch.length > 0 && (
              <Pressable onPress={() => setTaskSearch('')} style={styles.clearSearchBtn}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </Pressable>
            )}
          </View>
          <Pressable
            style={styles.refreshBtn}
            onPress={loadData}
            android_ripple={{ color: '#0ea5e920' }}>
            <Ionicons name="refresh" size={18} color={Colors.light.tint} />
            <Text style={styles.refreshText}>Reload</Text>
          </Pressable>
        </View>

        <FlatList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.tasksList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No tasks yet</Text>
              <Text style={styles.emptySubtext}>Tap "New Task" to create one</Text>
            </View>
          }
        />
      </View>

      {/* Create Task Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Task</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={28} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Task Title *</Text>
                <TextInput
                  style={styles.input}
                  value={newTask.title}
                  onChangeText={text => setNewTask({ ...newTask, title: text })}
                  placeholder="Enter task title"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newTask.description}
                  onChangeText={text => setNewTask({ ...newTask, description: text })}
                  placeholder="Enter task description"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Assign To *</Text>
                <Pressable
                  style={styles.dropdownButton}
                  onPress={() => setShowEmployeeDropdown(!showEmployeeDropdown)}>
                  <View style={styles.dropdownButtonContent}>
                    <Ionicons name="person" size={18} color="#64748b" />
                    <Text style={[styles.dropdownButtonText, !newTask.assignedTo && styles.placeholderText]}>
                      {newTask.assignedTo
                        ? employees.find(e => e.userId === newTask.assignedTo)?.name || 'Select employee'
                        : 'Select employee'}
                    </Text>
                  </View>
                  <Ionicons
                    name={showEmployeeDropdown ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#64748b"
                  />
                </Pressable>

                {showEmployeeDropdown && (
                  <View style={styles.dropdownContainer}>
                    <View style={styles.searchContainer}>
                      <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
                      <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search by name, ID, or department..."
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="none"
                      />
                      {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                          <Ionicons name="close-circle" size={18} color="#94a3b8" />
                        </Pressable>
                      )}
                    </View>

                    <ScrollView style={styles.employeeDropdownList} nestedScrollEnabled>
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(emp => (
                          <Pressable
                            key={emp.userId}
                            style={[
                              styles.employeeItem,
                              newTask.assignedTo === emp.userId && styles.employeeItemSelected,
                            ]}
                            onPress={() => {
                              setNewTask({ ...newTask, assignedTo: emp.userId });
                              setShowEmployeeDropdown(false);
                              setSearchQuery('');
                            }}>
                            <View style={styles.employeeItemLeft}>
                              <View
                                style={[
                                  styles.employeeAvatar,
                                  newTask.assignedTo === emp.userId && styles.employeeAvatarSelected,
                                ]}>
                                <Text style={styles.employeeAvatarText}>
                                  {emp.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <View style={styles.employeeInfo}>
                                <Text style={styles.employeeName}>{emp.name}</Text>
                                <Text style={styles.employeeMeta}>
                                  {emp.userId} • {emp.department || 'No dept'}
                                </Text>
                              </View>
                            </View>
                            {newTask.assignedTo === emp.userId && (
                              <Ionicons name="checkmark-circle" size={24} color={Colors.light.tint} />
                            )}
                          </Pressable>
                        ))
                      ) : (
                        <View style={styles.emptyDropdown}>
                          <Ionicons name="search" size={40} color="#cbd5e1" />
                          <Text style={styles.emptyDropdownText}>No employees found</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Deadline *</Text>
                <TextInput
                  style={styles.input}
                  value={newTask.deadline}
                  onChangeText={text => setNewTask({ ...newTask, deadline: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                />
                <Text style={styles.helpText}>Format: YYYY-MM-DD (e.g., 2025-12-31)</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={submitting}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleCreateTask}
                disabled={submitting}
                android_ripple={{ color: '#ffffff40' }}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Create Task</Text>
                  </>
                )}
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
    backgroundColor: '#f1f5f9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  adminName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  adminRole: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
  },
  /* New compact stats bar */
  statsWrapper: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  statIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statTextBlock: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22,
  },
  statCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 46,
    backgroundColor: '#e2e8f0',
    borderRadius: 1,
    marginHorizontal: 4,
  },
  /* Task toolbar */
  taskToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  taskSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    marginLeft: 10,
  },
  clearSearchBtn: {
    marginLeft: 6,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.tint + '40',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.tint,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tasksSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    gap: 6,
    shadowColor: Colors.light.tint,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  tasksList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  taskTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 14,
    lineHeight: 21,
  },
  taskFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  taskMetaLeft: {
    flexDirection: 'row',
    gap: 18,
    flexWrap: 'wrap',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  overdueText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#86efac',
  },
  inlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86efac',
  },
  inlineActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  completeButtonText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalBody: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  textArea: {
    height: 110,
    paddingTop: 14,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  placeholderText: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  dropdownContainer: {
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    backgroundColor: '#fff',
    maxHeight: 320,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  searchIcon: {
    marginLeft: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 6,
  },
  employeeDropdownList: {
    maxHeight: 250,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  employeeItemSelected: {
    backgroundColor: '#eff6ff',
  },
  employeeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeAvatarSelected: {
    backgroundColor: Colors.light.tint,
  },
  employeeAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  employeeMeta: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyDropdown: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyDropdownText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 12,
  },
  employeeList: {
    marginTop: 4,
  },
  employeeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: Colors.light.tint + '40',
    marginRight: 8,
  },
  employeeChipSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  employeeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  employeeChipTextSelected: {
    color: '#fff',
  },
  helpText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
    shadowColor: Colors.light.tint,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
