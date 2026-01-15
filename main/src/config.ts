const envApiUrl = import.meta.env.VITE_API_BASE_URL;
// If defined and NOT localhost (e.g. production URL), use it. 
// Otherwise use proxy '/api' which works for both localhost and specific network IPs.
export const API_BASE_URL = (envApiUrl && !envApiUrl.includes('localhost') && !envApiUrl.includes('127.0.0.1'))
    ? envApiUrl
    : '/api';
