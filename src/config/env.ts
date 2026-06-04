const normalizeBaseUrl = (value?: string) => (value || '').replace(/\/+$/, '');

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL) || 'https://serveurtontine.vercel.app/api';
export const SOCKET_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL) || 'https://serveurtontine.vercel.app';
