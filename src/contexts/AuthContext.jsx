import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode'; // Still useful for token expiry and user ID
import axios from 'axios';

const API_BASE_URL = "http://localhost:3000";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Function to fetch user data from the backend using the token
  const fetchAndSetCurrentUser = useCallback(async (token) => {
    if (!token) {
      logout(); // No token, so log out
      return null;
    }

    try {
      // 1. Decode token locally primarily for expiration check and potentially user ID
      //    We won't rely on other payload data from the token for user details.
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        console.warn("AuthContext: Token expired.");
        logout();
        return null;
      }

      // 2. Fetch full user details from the backend using the token
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data; // Expects { id, fullname, email, role }

      if (userData && userData.id) {
        setCurrentUser(userData);
        setAuthToken(token); // Keep the auth token state
        localStorage.setItem('token', token); // Keep token in storage
        console.log("AuthContext: User data fetched and set:", userData);
        return userData;
      } else {
        console.warn("AuthContext: Fetched user data is invalid.");
        logout();
        return null;
      }
    } catch (error) {
      console.error("AuthContext: Failed to fetch or process user data.", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // If API call fails due to auth (e.g. token invalid on server side, or user deleted)
        console.warn("AuthContext: Auth error during user data fetch, logging out.");
      }
      logout();
      return null;
    }
  }, []); // Removed logout from dependency array if it's stable

  // Load auth state on initial app load
  useEffect(() => {
    const initializeAuth = async () => {
      const tokenFromStorage = localStorage.getItem('token');
      if (tokenFromStorage) {
        await fetchAndSetCurrentUser(tokenFromStorage);
      }
      setIsLoadingAuth(false);
    };
    initializeAuth();
  }, [fetchAndSetCurrentUser]);

  // Login function
  const login = async (email, password) => {
    setIsLoadingAuth(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      if (response.data?.token) {
        // After successful login, token is received. Now fetch full user details.
        const user = await fetchAndSetCurrentUser(response.data.token);
        // The 'response.data.user' from login might be redundant if '/me' is comprehensive
        // or it could be used for an initial optimistic update.
        // For simplicity, we rely on fetchAndSetCurrentUser to set the final state.
        return user; // Return the user data fetched from /me
      } else {
        throw new Error(response.data?.message || "Login failed: No token received");
      }
    } catch (error) {
      console.error("AuthContext: Login failed:", error);
      logout(); // Ensure logout on failure
      const errorMsg = error.response?.data?.message || error.message;
      throw new Error(errorMsg);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Logout function
  const logout = useCallback(() => { // useCallback for logout if it's in dependencies
    localStorage.removeItem('token');
    setCurrentUser(null);
    setAuthToken(null);
    // Optionally: redirect to login page or clear other app state
  }, []);

  const value = {
    currentUser,
    authToken,
    isAuthenticated: !!currentUser && !!authToken,
    isLoadingAuth,
    login,
    logout,
    refreshUserData: useCallback(async () => { // Also make refreshUserData async
      setIsLoadingAuth(true);
      const tokenFromStorage = localStorage.getItem('token');
      if (tokenFromStorage) {
        await fetchAndSetCurrentUser(tokenFromStorage);
      }
      setIsLoadingAuth(false);
    }, [fetchAndSetCurrentUser])
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}