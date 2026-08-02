const API_BASE_URL = '/api';

const parseResponseBody = async (response) => {
    const text = await response.text();
    if (!text || text.trim().length === 0) {
        return {};
    }
    try {
        return JSON.parse(text);
    } catch (err) {
        if (!response.ok) {
            return {
                error: `Backend Server Connection Error (${response.status} ${response.statusText}). Please ensure the Express backend is running on port 5000.`,
            };
        }
        return { message: text };
    }
};

export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('accessToken');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
    } catch (netErr) {
        throw new Error('Network error: Unable to connect to the backend server. Please make sure backend is running on port 5000.');
    }

    // If 401 Unauthorized, attempt token refresh automatically
    if (response.status === 401 && !options._retry && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
        options._retry = true;
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (refreshRes.ok) {
                    const refreshData = await parseResponseBody(refreshRes);
                    if (refreshData.data?.accessToken) {
                        localStorage.setItem('accessToken', refreshData.data.accessToken);
                        localStorage.setItem('refreshToken', refreshData.data.refreshToken);

                        headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
                        response = await fetch(`${API_BASE_URL}${endpoint}`, {
                            ...options,
                            headers,
                        });
                    }
                } else {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
            } catch (err) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }
    }

    const data = await parseResponseBody(response);
    if (!response.ok) {
        throw new Error(data.error || data.message || `API Request failed with status ${response.status}`);
    }

    return data;
};
