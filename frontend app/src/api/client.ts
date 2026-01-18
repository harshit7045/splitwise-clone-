import axios from 'axios';
import { storage } from '../utils/storage';

// Configure this URL based on your setup
// For local development: http://localhost:5000/api
// For production: Update to your deployed backend URL
export const API_URL = 'https://splitwise-bqxz.onrender.com/api';

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(async (config) => {
    const token = await storage.getItem('user_token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

// Response interceptor to handle 401 (Unauthorized) errors
client.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear storage and redirect to login
            await storage.deleteItem('user_token');
            await storage.deleteItem('user_info');
            // Note: Navigation will be handled by auth state change in useAuth
        }
        return Promise.reject(error);
    }
);

export default client;
