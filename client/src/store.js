import { configureStore, createSlice } from "@reduxjs/toolkit";
import { deleteCookie } from "./utils/getJwt";
import constants from "./constants";

const defaultBlogAgent = {
  default: {
    content: "",
    numPosts: 0,
    numDays: 1,
    subject: "",
    loops: "",
    jwt: "",
    id: "",
    blogSubject: "",
    content: "",
    data: [],
    hasStarted: false,
    usedBlogPosts: 0,
    maxBlogPosts: constants.maxWordpressPosts,
    version: "wordpress",
  }
}

// Create Redux slice for error state
const slice = createSlice({
  name: "main",
  initialState: {
    bannerMessage: null,
    currentView: "home",
    isLoggedIn: false,
    user: {},
    activeBlogAgent: "default",
    colorScheme: localStorage.getItem("bloggerGPT-colorScheme") ? localStorage.getItem("bloggerGPT-colorScheme") : "dark",
    blogAgents: defaultBlogAgent
  },
  reducers: {
    login: (state, action) => {
      return {...state, isLoggedIn: true, blogAgents: action.payload.blogs, user: {}}
    },
    signOut: (state) => {
      deleteCookie(constants.authCookieName);
      return {...state, isLoggedIn: false, user: {}, blogAgents: defaultBlogAgent, activeBlogAgent: "default"}
    },
    setBannerMessage: (state, action) => {
      state.bannerMessage = action.payload;
    },
    clearBannerMessage: (state) => {
      state.bannerMessage = null;
    },
    setVersion: (state, action) => {
      const { blogID, version } = action.payload;
      state.blogAgents[blogID].version = version;
    },
    setCurrentView: (state, action) => {
      state.bannerMessage = null;
      state.currentView = action.payload;
    },
    setColorScheme: (state, action) => {
      localStorage.setItem("bloggerGPT-colorScheme", action.payload);
      state.colorScheme = action.payload;
    },
    updateBlogAgentData: (state, action) => {
      const { blogID, data, usedBlogPosts, maxBlogPosts } = action.payload;
      if (data.type === "ending") {
        state.blogAgents[blogID].hasStarted = false;
      }
      const oldData = [...state.blogAgents[blogID].data];
      if (oldData.length > 0 && oldData[oldData.length - 1].type === "updating") {
        oldData.pop();
      }
      oldData.push(data);
      state.blogAgents[blogID].data = oldData;
      if (usedBlogPosts && maxBlogPosts) {
        state.blogAgents[blogID].usedBlogPosts = usedBlogPosts;
        state.blogAgents[blogID].maxBlogPosts = maxBlogPosts;
      }
    },
    runAgent: (state, action) => {
      const { blogID } = action.payload;
      state.blogAgents[blogID].hasStarted = true;
      state.blogAgents[blogID].data = [];
    },
    addAgent: (state, action) => {
      state.blogAgents[action.payload.blogID] = action.payload
    },
  },
});

// Now we configure the store
const store = configureStore({ reducer: { main: slice.reducer } });
export default store;
export const { setBannerMessage, clearBannerMessage, setVersion, setCurrentView, setColorScheme, updateBlogAgentData, runAgent, addAgent, signOut } = slice.actions;
// export const actions = { ...slice.actions};


