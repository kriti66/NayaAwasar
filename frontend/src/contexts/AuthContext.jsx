import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    /**
     * Fetches KYC status from backend and merges into current user state.
     * Call after login or when KYC status may have changed (e.g. after submission or admin action).
     */
    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (!token) return;

        try {
            // We fetch the full user profile which includes KYC status and profileImage
            const res = await api.get('/auth/me');
            const data = res.data;

            // Map response to match stored user structure (or just replace it if structure is consistent)
            const updated = {
                id: data.id,
                fullName: data.fullName,
                email: data.email,
                role: data.role,
                kycStatus: data.kycStatus,
                isKycSubmitted: data.isKycSubmitted,
                isKycVerified: data.isKycVerified,
                rejectionReason: data.kycRejectionReason,
                profileImage: data.profileImage
            };

            // Preserve other fields if needed, but /auth/me should be the source of truth
            localStorage.setItem('user', JSON.stringify(updated));
            setUser(updated);
        } catch (err) {
            console.error("Failed to refresh user:", err);
            // Fallback: keep existing user but maybe mark session as risky if needed?
            // For now, do nothing or handle 401 logout elsewhere
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            refreshUser();
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: loginUser } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(loginUser));
            setUser(loginUser);
            await refreshUser();
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            let message = 'Login failed';
            if (error.response) {
                // Server responded with a status code outside 2xx
                message = error.response.data?.message || 'Server error';
            } else if (error.request) {
                // The request was made but no response was received
                message = 'Cannot connect to server. Is the backend running?';
            } else {
                // Something happened in setting up the request that triggered an Error
                message = error.message;
            }
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
    };

    const register = async (userData) => {
        try {
            console.log("AuthContext: Registering user...", userData.email);
            const response = await api.post('/auth/register', userData);
            const { token, user } = response.data;
            if (token && user) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                await refreshUser();
            }
            return { success: true };
        } catch (error) {
            console.error("Registration failed detail:", error);
            let message = 'Registration failed';
            if (error.response) {
                message = error.response.data?.message || 'Server error';
            } else if (error.request) {
                message = 'Cannot connect to server. Ensure backend is running on Port 5001.';
            } else {
                message = error.message;
            }
            return { success: false, message };
        }
    };
    const value = {
        user,
        loading,
        login,
        logout,
        register,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
