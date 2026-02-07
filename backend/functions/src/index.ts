import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export Firebase Functions
export const api = functions.https.onRequest((request, response) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  // Example endpoint
  if (request.path === '/health') {
    response.json({ status: 'ok', message: 'Backend is running' });
    return;
  }

  response.status(404).json({ error: 'Endpoint not found' });
});

// Example: Get all tasks
export const getTasks = functions.https.onCall(async (data, context) => {
  try {
    const tasksSnapshot = await admin.firestore().collection('tasks').get();
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, tasks };
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch tasks');
  }
});

// Example: Create a task
export const createTask = functions.https.onCall(async (data, context) => {
  try {
    const { title, description, assignedTo } = data;
    
    if (!title) {
      throw new functions.https.HttpsError('invalid-argument', 'Title is required');
    }

    const taskRef = await admin.firestore().collection('tasks').add({
      title,
      description,
      assignedTo,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });

    return { success: true, taskId: taskRef.id };
  } catch (error) {
    console.error('Error creating task:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create task');
  }
});
