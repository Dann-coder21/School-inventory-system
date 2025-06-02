// AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const API_BASE_URL = "http://localhost:3000";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Start as loading

  // Memoized logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setAuthToken(null);
    console.log("AuthContext: User logged out/token cleared.");
  }, []);

  // Function to fetch user data from the backend using the token
  // This function should handle setting currentUser and authToken based on backend response
  const fetchAndSetCurrentUser = useCallback(async (token) => {
    if (!token) {
      console.warn("AuthContext: No token provided to fetchAndSetCurrentUser.");
      logout(); // Ensures currentUser and authToken are null
      return null;
    }

    try {
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        console.warn("AuthContext: Token expired locally.");
        logout(); // Ensures currentUser and authToken are null
        return null;
      }

      // Fetch full user details from the backend to validate token and get fresh data
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data; // Expects { id, fullname, email, role }

      if (userData && userData.id) {
        setCurrentUser(userData);
        setAuthToken(token);
        localStorage.setItem('token', token);
        console.log("AuthContext: User data fetched and set:", userData.email, "Role:", userData.role);
        return userData;
      } else {
        console.warn("AuthContext: Fetched user data is invalid or empty.");
        logout();
        return null;
      }
    } catch (error) {
      console.error("AuthContext: Failed to fetch or process user data from /auth/me.", error.message);
      // Log full error for debugging
      if (error.response) {
        console.error("AuthContext: Backend response error:", error.response.status, error.response.data);
      }
      // If API call fails due to auth (e.g., token invalid on server side, or user deleted)
      // or any other network error, log out the user.
      logout();
      return null;
    }
  }, [logout]); // Added logout to dependency array as it's a stable callback

  // Load auth state on initial app load
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoadingAuth(true); // Ensure loading state is active
      const tokenFromStorage = localStorage.getItem('token');
      try {
        if (tokenFromStorage) {
          console.log("AuthContext: Found token in storage, attempting to fetch user data.");
          await fetchAndSetCurrentUser(tokenFromStorage);
        } else {
          console.log("AuthContext: No token found in storage. User is not authenticated.");
          setCurrentUser(null); // Explicitly ensure null state
          setAuthToken(null);    // Explicitly ensure null state
        }
      } catch (error) {
        // This catch block handles errors that might occur *outside* fetchAndSetCurrentUser
        // (though fetchAndSetCurrentUser is robust). It's good practice.
        console.error("AuthContext: Error during initial authentication process:", error);
        setCurrentUser(null);
        setAuthToken(null);
        localStorage.removeItem('token');
      } finally {
        // This ensures isLoadingAuth is set to false ONLY after all attempts
        // to initialize authentication have completed.
        setIsLoadingAuth(false);
        console.log("AuthContext: Initial authentication process finished.");
      }
    };
    initializeAuth();
  }, [fetchAndSetCurrentUser, logout]); // Added logout to dependencies of useEffect because it's called in else branch

  // Login function
  const login = async (email, password) => {
    setIsLoadingAuth(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      if (response.data?.token) {
        // After successful login, token is received. Now fetch full user details
        // using the token, which also updates currentUser and authToken states.
        const user = await fetchAndSetCurrentUser(response.data.token);
        if (!user) {
          throw new Error("Login failed: Could not retrieve user data after token acquisition.");
        }
        return user;
      } else {
        throw new Error(response.data?.message || "Login failed: No token received from backend.");
      }
    } catch (error) {
      console.error("AuthContext: Login failed:", error);
      logout(); // Ensure logout on failure
      const errorMsg = error.response?.data?.message || error.message || "An unknown error occurred during login.";
      throw new Error(errorMsg); // Re-throw to be caught by login component
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const refreshUserData = useCallback(async () => {
    setIsLoadingAuth(true);
    const tokenFromStorage = localStorage.getItem('token');
    try {
      if (tokenFromStorage) {
        await fetchAndSetCurrentUser(tokenFromStorage);
      } else {
        console.log("AuthContext: No token found for refreshUserData.");
        logout();
      }
    } catch (error) {
      console.error("AuthContext: Error during refreshUserData:", error);
      logout();
    } finally {
      setIsLoadingAuth(false);
    }
  }, [fetchAndSetCurrentUser, logout]);

  const value = {
    currentUser,
    authToken,
    isAuthenticated: !!currentUser && !!authToken,
    isLoadingAuth,
    login,
    logout,
    refreshUserData,
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