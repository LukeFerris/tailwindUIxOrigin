// THE FOLLOWING IS AN EXAMPLE REDUX STORE SLICE WITH ASYNC THUNKS
// IT COVERS A TASKS SLICE WHICH IS FETCHING AND POSTING TASKS TO AN API USING AXIOS

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// IMPORTANT: The store key for this slice is the same as the name: [CHANGE for name property of slice e.g. tasksState in this example]. You should use this when accessing state related to this slice.

// Example API endpoing using the VITE import.meta approach
const API_URL = import.meta.env.VITE_TaskAPIUrl;

// Async thunk for fetching tasks from the API using Axios
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      // Handle error more precisely to get a meaningful message
      const errorMessage = error.response?.data?.message || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for posting a new task to the API using Axios
export const postTask = createAsyncThunk(
  "tasks/postTask",
  async (newTask, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, newTask, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  tasks: [],
  loading: false,
  error: null,
};

const tasksSlice = createSlice({
  name: "tasksState",
  initialState,
  reducers: {},
  // use extraReducers to handle the async thunk states, modifying the state directly in the addCase
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(postTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.push(action.payload);
      })
      .addCase(postTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// expose selectors to access the primary state (tasks) and the loading and error states
export const selectTasks = (state) => state.tasks.tasks;
export const selectLoading = (state) => state.tasks.loading;
export const selectError = (state) => state.tasks.error;

// Export the reducer to be used in the store
export const tasksReducer = tasksSlice.reducer;
