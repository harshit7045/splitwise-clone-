import axios from 'axios';
import { storage } from '../utils/storage';

// Placeholder URL - to be updated when user provides cloud URL
export const API_URL = 'http://192.168.0.113:5000/api';

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
