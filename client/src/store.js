import { configureStore, createSlice } from "@reduxjs/toolkit";

// Create Redux slice for error state
const slice = createSlice({
  name: "main",
  initialState: {
    bannerMessage: null,
    version: localStorage.getItem("bloggerGPT-version") ? localStorage.getItem("bloggerGPT-version") : "wordpress",
    popUpTemplate: null,
    currentView: "blogger"
  },
  reducers: {
    setBannerMessage: (state, action) => {
      state.bannerMessage = action.payload;
    },
    clearBannerMessage: (state) => {
      state.bannerMessage = null;
    },
    setVersion: (state, action) => {
      localStorage.setItem("bloggerGPT-version", action.payload);
      state.version = action.payload;
    },
    setPopUpTemplate: (state, action) => {
      state.popUpTemplate = action.payload;
    },
    clearPopUpTemplate: (state) => {
      state.popUpTemplate = null;
    },
    setCurrentView: (state, action) => {
      state.bannerMessage = null;
      state.currentView = action.payload;
    }
  },
});

// Now we configure the store
const store = configureStore({ reducer: { main: slice.reducer } });
export default store;
export const { setBannerMessage, clearBannerMessage, setVersion, setPopUpTemplate, clearPopUpTemplate, setCurrentView } = slice.actions;
