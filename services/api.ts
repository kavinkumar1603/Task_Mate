import Constants from 'expo-constants';

// You might need to change this URL depending on your environment (emulator vs production)
// For Android emulator, use 'http://10.0.2.2:5001/YOUR_PROJECT_ID/us-central1/api'
// For iOS simulator, use 'http://localhost:5001/YOUR_PROJECT_ID/us-central1/api'
// For production, use your deployed function URL
const getBaseUrl = () => {
    const projectId = (Constants.expoConfig?.extra as any)?.firebase?.projectId || 'taskflow-395c7';

    if (Constants.expoConfig?.hostUri) {
        const host = Constants.expoConfig.hostUri.split(':')[0];
        return `http://${host}:5001/${projectId}/us-central1/api`;
    }

    return `http://10.0.2.2:5001/${projectId}/us-central1/api`;
};

const BASE_URL = getBaseUrl();
console.log('API BASE_URL:', BASE_URL);

export const api = {
    async get(endpoint: string) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`GET ${endpoint} failed:`, error);
            throw error;
        }
    },

    async post(endpoint: string, data: any) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }
            // Check if response has content before parsing JSON
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error(`POST ${endpoint} failed:`, error);
            throw error;
        }
    },

    async put(endpoint: string, data: any) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error(`PUT ${endpoint} failed:`, error);
            throw error;
        }
    },

    async delete(endpoint: string) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error(`DELETE ${endpoint} failed:`, error);
            throw error;
        }
    }
};
