import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';

/**
 * Send push notification via Expo Push API
 * @param expoToken - The Expo push token
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional custom data
 */
export async function sendPushNotification(
  expoToken: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: expoToken,
        sound: 'default',
        title: title,
        body: body,
        data: data || { customData: 'taskAssigned' },
      }),
    });

    const result = await response.json();
    console.log('Notification sent:', result);
    return result;
  } catch (error) {
    console.error('Notification Error:', error);
    throw error;
  }
}

/**
 * Notify assigned user when a task is created
 * @param assignedUserId - The user ID who is assigned the task
 * @param taskTitle - The title of the task
 * @param taskId - Optional task ID to include in notification data
 */
export async function notifyAssignedUser(
  assignedUserId: string,
  taskTitle: string,
  taskId?: string
) {
  try {
    // Fetch user document from employees collection
    const userDoc = await getDoc(doc(db, 'employees', assignedUserId));

    if (!userDoc.exists()) {
      console.log(`User ${assignedUserId} not found`);
      return;
    }

    const userData = userDoc.data();
    const tokens = userData.expoPushTokens || [];

    if (tokens.length === 0) {
      console.log(`No push tokens found for user ${assignedUserId}`);
      return;
    }

    // Send notification to all registered devices
    const notificationPromises = tokens.map((token: string) =>
      sendPushNotification(
        token,
        'New Task Assigned',
        `Task: ${taskTitle}`,
        { taskId, type: 'task_assigned' }
      )
    );

    await Promise.all(notificationPromises);
    console.log(`Notified user ${assignedUserId} about task: ${taskTitle}`);
  } catch (error) {
    console.error('Error notifying user:', error);
    // Don't throw error - notification failure shouldn't block task creation
  }
}
