// THE FOLLOWING IS AN EXAMPLE REDUX STORE SLICE
import { createSlice } from "@reduxjs/toolkit";

// IMPORTANT: The store key for this slice is the same as the name: [CHANGE for name property of slice e.g. visibility in this example]. You should use this when accessing state related to this slice.

let initialState = [];

// create the new slice
const visibilitySlice = createSlice({
  name: "visibility",
  initialState,
  reducers: {},
  // if any extraReducers are required
  extraReducers: (builder) => {},
});

// Any action publically required creator or action or reducer not exported elsewhere must be exported here
// export const { toggleVisibility } = visibilitySlice.actions;
