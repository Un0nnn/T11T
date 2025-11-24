import React, { createContext, useContext, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Get the BACKEND_URL from Vite env with a default
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        // On mount, check for token and try to fetch user info
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            return;
        }

        fetch(`${VITE_BACKEND_URL}/user/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        })
        .then(async (res) => {
            if (!res.ok) {
                // token invalid or other error
                localStorage.removeItem('token');
                setUser(null);
                return;
            }
            const data = await res.json();
            setUser(data.user);
        })
        .catch((err) => {
            console.error('Failed to fetch user on mount', err);
            localStorage.removeItem('token');
            setUser(null);
        });
    }, [])

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        // Remove token and clear user state
        localStorage.removeItem('token');
        setUser(null);

        navigate("/");
    };

    /**
     * Login a user with their credentials.
     *
     * @remarks Upon success, navigates to "/profile". 
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (username, password) => {
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                return data.message || 'Login failed';
            }

            // Success: store token (exact key 'token' required by tester), update user state, navigate
            const token = data.token;
            // Store the token as 'Bearer <token>' because backend UserService.verify expects that format
            localStorage.setItem('token', `Bearer ${token}`);

            // fetch the user info
            const meRes = await fetch(`${VITE_BACKEND_URL}/user/me`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });

            if (!meRes.ok) {
                // clear token if unable to retrieve user
                localStorage.removeItem('token');
                return 'Failed to retrieve user info';
            }

            const meData = await meRes.json();
            setUser(meData.user);

            navigate('/profile');
            return null;
        }
        catch (err) {
            console.error('Login error', err);
            return 'Login failed';
        }
    };

    /**
     * Registers a new user. 
     * 
     * @remarks Upon success, navigates to "/success".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await res.json();

            if (!res.ok) {
                return data.message || 'Registration failed';
            }

            // success
            navigate('/success');
            return null;
        }
        catch (err) {
            console.error('Register error', err);
            return 'Registration failed';
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
