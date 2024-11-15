// THIS IS AN EXAMPLE USERAUTHANDADMIN REDUX STORE SLICE. YOU MUST CHANGE THE API URL, USER POOL AND USERCLIENT AT MINIMUM

// IMPORTANT: The store key for this slice is guaranteed to be userAuthAndAdmin. You should use this when accessing state related to this slice e.g. state.userAuthAndAdmin

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";

// Validation helper functions
const isString = (value) =>
  typeof value === "string" || value instanceof String;

const isValidUserData = (userData) => {
  if (!userData || typeof userData !== "object") {
    console.log("Invalid user data: not an object");
    return false;
  }
  if (!isString(userData.username)) {
    console.log("Invalid user data: username must be a string");
    return false;
  }
  if (!isString(userData.password)) {
    console.log("Invalid user data: password must be a string");
    return false;
  }
  if (!isString(userData.email)) {
    console.log("Invalid user data: email must be a string");
    return false;
  }
  return true;
};

const isValidGroups = (groups) => {
  if (!Array.isArray(groups)) {
    console.log("Invalid groups: not an array");
    return false;
  }
  return groups.every((group) => isString(group));
};

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_CognitoAuthUserPoolId,
  ClientId: import.meta.env.VITE_CognitoAuthUserPoolClientId,
});

const COGNITO_AUTH_URL = import.meta.env.VITE_CognitoAuthUrl;

// Async thunk for user login
// inputs: { username: string, password: string }
export const loginUser = createAsyncThunk(
  "userAuthAndAdmin/loginUser",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      if (!isString(username) || !isString(password)) {
        throw new Error("Username and password must be strings");
      }

      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: userPool,
      });

      return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: (session) => {
            const groups = session.getIdToken().payload["cognito:groups"] || [];
            if (!isValidGroups(groups)) {
              reject(new Error("Invalid groups data received from Cognito"));
              return;
            }
            console.log("Login successful");
            resolve({
              authToken: session.getIdToken().getJwtToken(),
              username: username,
              userGroups: groups,
            });
          },
          onFailure: (err) => {
            console.log("Login failed:", err);
            reject(err);
          },
        });
      });
    } catch (error) {
      console.log("Login error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for user logout
// inputs: none
export const logoutUser = createAsyncThunk(
  "userAuthAndAdmin/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = userPool.getCurrentUser();
      if (currentUser) {
        currentUser.signOut();
      }
      console.log("Logout successful");
      return true;
    } catch (error) {
      console.log("Logout error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for initializing auth state
// inputs: none
export const initializeAuthState = createAsyncThunk(
  "userAuthAndAdmin/initializeAuthState",
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        return null;
      }
      return new Promise((resolve, reject) => {
        currentUser.getSession((err, session) => {
          if (err) {
            console.log("Session validation error:", err);
            reject(err);
            return;
          }
          if (session.isValid()) {
            console.log("Valid session found");
            resolve({
              authToken: session.getIdToken().getJwtToken(),
              username: currentUser.getUsername(),
              userGroups: session.getIdToken().payload["cognito:groups"] || [],
            });
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.log("Initialize auth state error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for refreshing auth token
// inputs: none
export const refreshAuthToken = createAsyncThunk(
  "userAuthAndAdmin/refreshAuthToken",
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        throw new Error("No current user");
      }
      return new Promise((resolve, reject) => {
        currentUser.getSession((err, session) => {
          if (err) {
            console.log("Token refresh error:", err);
            reject(err);
            return;
          }
          resolve({
            authToken: session.getIdToken().getJwtToken(),
            username: currentUser.getUsername(),
            userGroups: session.getIdToken().payload["cognito:groups"] || [],
          });
        });
      });
    } catch (error) {
      console.log("Token refresh error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for listing users
// inputs: none
export const listUsers = createAsyncThunk(
  "userAuthAndAdmin/listUsers",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { authToken } = getState().userAuthAndAdmin;
      const response = await axios.get(`${COGNITO_AUTH_URL}/users`, {
        headers: {
          Authorization: authToken,
        },
      });
      return response.data;
    } catch (error) {
      console.log("List users error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for adding a new user
// inputs: { username: string, password: string, email: string }
export const addUser = createAsyncThunk(
  "userAuthAndAdmin/addUser",
  async (userData, { getState, rejectWithValue }) => {
    try {
      if (!isValidUserData(userData)) {
        throw new Error("Invalid user data format");
      }

      const { authToken } = getState().userAuthAndAdmin;
      const response = await axios.post(`${COGNITO_AUTH_URL}/users`, userData, {
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.log("Add user error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for deleting a user
// inputs: userId: string
export const deleteUser = createAsyncThunk(
  "userAuthAndAdmin/deleteUser",
  async (userId, { getState, rejectWithValue }) => {
    try {
      if (!isString(userId)) {
        throw new Error("User ID must be a string");
      }

      const { authToken } = getState().userAuthAndAdmin;
      const response = await axios.delete(
        `${COGNITO_AUTH_URL}/users/${userId}`,
        {
          headers: { Authorization: authToken },
        }
      );
      return response.data;
    } catch (error) {
      console.log("Delete user error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  authToken: null,
  username: null,
  userGroups: [],
  isAuthenticated: false,
  loading: false,
  error: null,
  users: [],
};

const userAuthAndAdminSlice = createSlice({
  name: "userAuthAndAdmin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.authToken = action.payload.authToken;
        state.username = action.payload.username;
        state.userGroups = action.payload.userGroups;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        return { ...initialState };
      })
      .addCase(initializeAuthState.fulfilled, (state, action) => {
        if (action.payload) {
          state.authToken = action.payload.authToken;
          state.username = action.payload.username;
          state.userGroups = action.payload.userGroups;
          state.isAuthenticated = true;
        }
      })
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.authToken = action.payload.authToken;
        state.username = action.payload.username;
        state.userGroups = action.payload.userGroups;
        state.isAuthenticated = true;
      })
      .addCase(listUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(listUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const userAuthAndAdminReducer = userAuthAndAdminSlice.reducer;
