// AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

// --- RECTIFIED CODE STARTS HERE ---

// Define the API_BASE_URL using Vite's environment variable syntax.
// This ensures that:
// - In production (on Vercel), it uses your deployed backend URL (e.g., https://inventory-server.fly.dev).
// - In local development, it defaults to your local backend URL (e.g., http://localhost:3000).
// IMPORTANT: Adjust "http://localhost:3000" if your local backend runs on a different port.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- RECTIFIED CODE ENDS HERE ---


export const AuthContext = createContext(null);

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
  }, []); // No dependencies for logout

  // Function to fetch user data from the backend using the token
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
      // Ensure this endpoint is correct (e.g., /auth/me or /api/auth/me)
      // --- RECTIFIED: Use API_BASE_URL for GET request ---
      const response = await axios.get(`${API_BASE_URL}/auth/me`, { // <-- CHANGED
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // --- END RECTIFIED ---

      const userData = response.data; // Expects { id, fullname, email, role }

      if (userData && userData.id) {
        setCurrentUser(userData);
        setAuthToken(token); // Update authToken state as well
        localStorage.setItem('token', token); // Ensure token is in local storage
        console.log("AuthContext: User data fetched and set for:", userData.email, "Role:", userData.role);
        return userData;
      } else {
        console.warn("AuthContext: Fetched user data is invalid or empty.");
        logout();
        return null;
      }
    } catch (error) {
      console.error("AuthContext: Failed to fetch or process user data from /auth/me.", error.message);
      if (error.response) {
        console.error("AuthContext: Backend response error for /auth/me:", error.response.status, error.response.data);
      }
      logout(); // Log out on any API error during token validation
      return null;
    }
  }, [logout]); // fetchAndSetCurrentUser depends on logout

  // Load auth state on initial app load and token changes
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoadingAuth(true); // Set loading true at the start of initialization
      const tokenFromStorage = localStorage.getItem('token');
      try {
        if (tokenFromStorage) {
          console.log("AuthContext: Found token in storage, attempting to fetch user data.");
          await fetchAndSetCurrentUser(tokenFromStorage);
        } else {
          console.log("AuthContext: No token found in storage. User is not authenticated.");
          setCurrentUser(null);
          setAuthToken(null);
        }
      } catch (error) {
        console.error("AuthContext: Error during initial authentication process:", error);
        setCurrentUser(null);
        setAuthToken(null);
        localStorage.removeItem('token');
      } finally {
        setIsLoadingAuth(false); // Set loading false only after all checks are done
        console.log("AuthContext: Initial authentication process finished. Current user:", currentUser?.email);
      }
    };
    initializeAuth();
  }, [fetchAndSetCurrentUser]); // Keeping fetchAndSetCurrentUser here is good practice as it's a callback

  // Login function - this is the one the Login component should call
  const login = useCallback(async (email, password) => {
    setIsLoadingAuth(true);
    try {
      // Ensure this matches your backend login endpoint, e.g., /auth/login or /api/auth/login
      // --- RECTIFIED: Use API_BASE_URL for POST request ---
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { // <-- CHANGED
        email,
        password,
      });
      // --- END RECTIFIED ---

      if (response.data?.token) {
        const user = await fetchAndSetCurrentUser(response.data.token);
        if (!user) {
          throw new Error("Login failed: Could not retrieve user data after token acquisition.");
        }
        return user; // Return the user object for the component that called login
      } else {
        throw new Error(response.data?.message || "Login failed: No token received from backend.");
      }
    } catch (error) {
      console.error("AuthContext: Login failed:", error);
      logout();
      let errorMessage = "An unknown error occurred during login.";
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = error.response.data?.message || "Incorrect email or password. Please check your credentials.";
        } else if (error.response.status === 404) {
          errorMessage = error.response.data?.message || "No account found with that email address.";
        } else {
          errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        }
      } else if (error.message === "Network Error") {
        errorMessage = "Network Error: Could not connect to the server. Please check your internet connection or try again later."; // More user-friendly
      } else if (error.message) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [fetchAndSetCurrentUser, logout]); // Dependencies for login useCallback

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

  // Consolidate `isAuthenticated` logic.
  const isAuthenticated = useMemo(() => !!currentUser && !!authToken && !isLoadingAuth, [currentUser, authToken, isLoadingAuth]);

  const value = {
    currentUser,
    authToken,
    isAuthenticated,
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