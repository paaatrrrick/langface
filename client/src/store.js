import { configureStore, createSlice } from "@reduxjs/toolkit";

// Create Redux slice for error state
const slice = createSlice({
  name: "main",
  initialState: {
    popUpMessage: null,
    version: localStorage.getItem("bloggerGPT-version")
      ? localStorage.getItem("bloggerGPT-version")
      : "wordpress",
  },
  reducers: {
    setPopUpMessage: (state, action) => {
      state.popUpMessage = action.payload;
    },
    clearPopUpMessage: (state) => {
      state.popUpMessage = null;
    },
    setVersion: (state, action) => {
      localStorage.setItem("bloggerGPT-version", action.payload);
      state.version = action.payload;
    },
  },
});

// Now we configure the store
const store = configureStore({ reducer: { main: slice.reducer } });
export default store;
export const { setPopUpMessage, clearPopUpMessage, setVersion } = slice.actions;
