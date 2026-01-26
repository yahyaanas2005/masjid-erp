export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

export const api = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        let errorMessage = 'API Error';
        try {
            const error = await res.json();
            errorMessage = error.message || errorMessage;
        } catch (e) {
            // If JSON parse fails, try text
            const text = await res.text();
            console.error('API Non-JSON Error:', text); // Log for debugging
            errorMessage = `Server Error (${res.status}): ${text.slice(0, 50)}...`;
        }
        throw new Error(errorMessage);
    }

    return res.json();
};
