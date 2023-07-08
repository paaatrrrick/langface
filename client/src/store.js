import { configureStore, createSlice } from "@reduxjs/toolkit";
import { deleteCookie } from "./utils/getJwt";
import constants from "./constants";

const defaultBlogAgent = {
  default: {
    content: "",
    maxNumberOfPosts: 0,
    daysToRun: 1,
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
    dropDownTitle: "New Agent",
  }
}

// Create Redux slice for error state
const slice = createSlice({
  name: "main",
  initialState: {
    tabId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    bannerMessage: null,
    currentView: "home",
    isLoggedIn: false,
    user: {},
    activeBlogAgent: "default",
    colorScheme: localStorage.getItem("bloggerGPT-colorScheme") ? localStorage.getItem("bloggerGPT-colorScheme") : "dark",
    blogAgents: defaultBlogAgent
  },
  reducers: {
    newBlogAgent: (state) => {
      state.blogAgents = {...state.blogAgents, 'New Agent': defaultBlogAgent.default}
      state.activeBlogAgent = 'New Agent';
    },
    standardizeBlogAgent: (state, action) => {
      state.blogAgents[action.payload.activeBlogAgent] = {...state.blogAgents[action.payload.activeBlogAgent], ...action.payload.data}
    },
    setActiveBlogAgent: (state, action) => {
      state.activeBlogAgent = action.payload;
    },
    login: (state, action) => {
      var { blogs, user } = action.payload;
      if (!blogs || blogs.length === 0) {
        return {...state, isLoggedIn: true, user }
      };
      const blogMap = {};
      for (let blog of blogs) {
        const tempBlog = {
          content: blog.config || "",
          version: blog.version || "wordpress",
          maxBlogPosts: blog.maxNumberOfPosts || 0,
          usedBlogPosts: blog.postsLeftToday || 0,
          daysToRun: blog.daysLeft || 0,
          loops: blog.loops || "",
          jwt: blog.jwt || "",
          id: blog.blogID || "",
          blogSubject: blog.subject || `New Agent: #${Object.keys(blogMap).length + 1}`,
          data: blog.blogPosts || [],
          hasStarted: false,
        }
        blogMap[blog._id] = tempBlog;
      }
      return {...state, isLoggedIn: true, blogAgents: blogMap, user: user, activeBlogAgent: Object.keys(blogMap)[0]}
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
      console.log(action.payload);
      const { blogId, type, title, url, content, usedBlogPosts, maxBlogPosts } = action.payload;
      console.log(blogId);
      const data = { type, title, url, content };
      console.log(data);
    
      if (data.type === "ending") {
        state.blogAgents[blogId].hasStarted = false;
      }
      if (state.blogAgents[blogId].data.length > 0 && state.blogAgents[blogId].data[state.blogAgents[blogId].data.length - 1].type === "updating") {
        state.blogAgents[blogId].data.pop();
      }
      state.blogAgents[blogId].data.push(data);      
      if (usedBlogPosts && maxBlogPosts) {
        state.blogAgents[blogId].usedBlogPosts = usedBlogPosts;
        state.blogAgents[blogId].maxBlogPosts = maxBlogPosts;
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
export const { setBannerMessage, clearBannerMessage, setVersion, setCurrentView, setColorScheme, updateBlogAgentData, runAgent, addAgent, login, signOut, newBlogAgent, setActiveBlogAgent, standardizeBlogAgent } = slice.actions;
// export const actions = { ...slice.actions};


