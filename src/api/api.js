import axios from 'axios';

// Якщо додаток запущено на Vercel, підтягнеться змінна з Vercel. 
// Якщо локально — автоматично підставиться localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;