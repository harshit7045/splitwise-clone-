import axios from 'axios';
import { storage } from '../utils/storage';

// Configure this URL based on your setup
// For local development: http://localhost:5000/api
// For production: Update to your deployed backend URL
export const API_URL = 'http://localhost:5000/api';

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

export default client;
