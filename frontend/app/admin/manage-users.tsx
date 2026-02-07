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
import { Employee } from '@/types';

export default function ManageUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Employee[]>([]);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await api.get('/users');
      setUsers(usersData as Employee[]);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (user: Employee) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';

    Alert.alert(
      'Change Role',
      `Change ${user.name}'s role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setProcessingUserId(user.userId);
              await api.put(`/users/${user.userId}`, { role: newRole });

              Alert.alert('Success', `${user.name} is now ${newRole}`);
              await loadUsers();
            } catch (error) {
              console.error('Error updating role:', error);
              Alert.alert('Error', 'Failed to update user role');
            } finally {
              setProcessingUserId(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (user: Employee) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingUserId(user.userId);

              await api.delete(`/users/${user.userId}`);

              Alert.alert('Success', 'User deleted successfully');
              await loadUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            } finally {
              setProcessingUserId(null);
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: Employee }) => {
    const isProcessing = processingUserId === item.userId;

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userId}>ID: {item.userId}</Text>
          </View>
          <View style={[
            styles.roleBadge,
            { backgroundColor: item.role === 'admin' ? '#dbeafe' : '#f3e8ff' }
          ]}>
            <Text style={[
              styles.roleText,
              { color: item.role === 'admin' ? '#3b82f6' : '#a855f7' }
            ]}>
              {item.role}
            </Text>
          </View>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.email || 'No email'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call" size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.phone || 'No phone'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="briefcase" size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.department || 'No department'}</Text>
          </View>
        </View>

        <View style={styles.userActions}>
          <Pressable
            style={[styles.actionButton, styles.roleButton]}
            onPress={() => handleToggleRole(item)}
            disabled={isProcessing}>
            {isProcessing ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <>
                <Ionicons
                  name={item.role === 'admin' ? 'remove-circle' : 'add-circle'}
                  size={18}
                  color="#3b82f6"
                />
                <Text style={styles.roleButtonText}>
                  {item.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteUser(item)}
            disabled={isProcessing}>
            <Ionicons name="trash" size={18} color="#dc2626" />
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
        <Text style={styles.loadingText}>Loading Users...</Text>
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
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{users.length}</Text>
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
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
  listContainer: {
    padding: 20,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  userId: {
    fontSize: 13,
    color: '#64748b',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  roleButton: {
    backgroundColor: '#eff6ff',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    fontSize: 14,
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
});
