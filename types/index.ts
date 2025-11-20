export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Employee ID
  assignedToName: string; // Employee name for display
  deadline: string; // ISO date string
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  createdBy: string; // Admin user ID
  completedAt?: string;
}

export interface Employee {
  userId: string;
  name: string;
  phone: string;
  category: string;
  department: string;
  password: string;
  role: 'user' | 'admin';
}
