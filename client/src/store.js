import { configureStore, createSlice } from "@reduxjs/toolkit";
import { deleteCookie } from "./utils/getJwt";
import constants from "./constants";

const defaultBlogAgent = {
  default: {
    config: "",
    postsLeftToday: constants.maxPosts,
    daysLeft: 1,
    loops: 1,
    jwt: "",
    blogID: "",
    subject: "",
    config: "",
    data: [],
    hasStarted: false,
    maxNumberOfPosts: constants.maxPosts,
    version: "html",
    dropDownTitle: "New Agent",
    demo: true,
  }
}

// Create Redux slice for error state
const slice = createSlice({
  name: "main",
  initialState: {
    tabId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    bannerMessage: null,
    currentView: "home",
    htmlModal: "<h1>yo</h1>",
    isLoggedIn: false,
    blogIds: [],
    user: {},
    activeBlogAgent: "default",
    colorScheme: localStorage.getItem("bloggerGPT-colorScheme") ? localStorage.getItem("bloggerGPT-colorScheme") : "dark",
    blogAgents: defaultBlogAgent
  },
  reducers: {
    setHtmlModal: (state, action) => {
      console.log(action.payload);
      state.htmlModal = action.payload;
    },
    setBlogIds (state, action) {
      const res = [...state.blogIds, ...action.payload];
      //remove duplicates
      state.blogIds = [...new Set(res)];
    },
    addBlogAgent: (state, action) => {
      const { config, version, maxNumberOfPosts, postsLeftToday, daysLeft, loops, jwt, blogID, subject, blogPosts, _id } = action.payload;
      const tempBlog = {
        config: config || "",
        version: version || "wordpress",
        maxNumberOfPosts: maxNumberOfPosts || 0,
        postsLeftToday: postsLeftToday || 0,
        daysLeft: daysLeft || 0,
        loops: loops || "",
        jwt: jwt || "",
        blogID: blogID || "",
        subject: subject || '',
        data: blogPosts || [],
        hasStarted: false,
      }
      state.blogAgents[_id] = tempBlog;
      state.activeBlogAgent = _id;
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
        const { config, version, maxNumberOfPosts, postsLeftToday, daysLeft, loops, jwt, blogID, subject, blogPosts, hasStarted } = blog;
        const tempBlog = {
          config: config || "",
          version: version || "wordpress",
          maxNumberOfPosts: maxNumberOfPosts || 0,
          postsLeftToday: postsLeftToday || 0,
          daysLeft: daysLeft || 0,
          loops: loops || "",
          jwt: jwt || "",
          blogID: blogID || "",
          subject: subject || ``,
          data: blogPosts || [],
          hasStarted: hasStarted,
        }
        blogMap[blog._id] = tempBlog;
      }
      return {...state, isLoggedIn: true, blogAgents: blogMap, user: user, activeBlogAgent: Object.keys(blogMap)[0]}
    },
    setVersion: (state, action) => {
      const { activeBlogAgent, version } = action.payload;
      state.blogAgents[activeBlogAgent].version = version;
    },
    signOut: (state) => {
      deleteCookie();
      return {...state, isLoggedIn: false, user: {}, blogAgents: defaultBlogAgent, activeBlogAgent: "default"}
    },
    setBannerMessage: (state, action) => {
      state.bannerMessage = action.payload;
    },
    clearBannerMessage: (state) => {
      state.bannerMessage = null;
    },
    setCurrentView: (state, action) => {
      state.bannerMessage = null;
      state.currentView = action.payload;
    },
    setColorScheme: (state, action) => {
      window.localStorage.setItem("bloggerGPT-colorScheme", action.payload);
      state.colorScheme = action.payload;
    },
    updateBlogAgentData: (state, action) => {
      const { blogId, type, title, url, config, postsLeftToday, maxNumberOfPosts, hasStarted } = action.payload;
      console.log("updateBlogAgentData", action.payload)
      const data = { type, title, url, config };
    
      state.blogAgents[blogId].hasStarted = hasStarted;
      if (state.blogAgents[blogId].data.length > 0 && state.blogAgents[blogId].data[state.blogAgents[blogId].data.length - 1].type === "updating") {
        state.blogAgents[blogId].data.pop();
      }
      state.blogAgents[blogId].data.push(data);      
      if (postsLeftToday !== null && maxNumberOfPosts !== null) {
        state.blogAgents[blogId].postsLeftToday = postsLeftToday || state.blogAgents[blogId].postsLeftToday;
        state.blogAgents[blogId].maxNumberOfPosts = maxNumberOfPosts || state.blogAgents[blogId].maxNumberOfPosts;
      }
    },

    initializeBlogAgent: (state, action) => {
      const { subject, config, maxNumberOfPosts, postsLeftToday, daysLeft, loops, jwt, blogID, version, dropDownTitle, demo, _id } = action.payload;
      const mapActualsTooInputs = {config, maxNumberOfPosts, daysLeft, loops, jwt, blogID, subject, version, dropDownTitle, demo, data: [], hasStarted: true, postsLeftToday};
      if (!state.blogAgents[_id]) {
        delete state.blogAgents[state.activeBlogAgent];
        state.activeBlogAgent = _id;
      }
      state.blogAgents[_id] = mapActualsTooInputs;
    },
  },
});

// Now we configure the store
const store = configureStore({ reducer: { main: slice.reducer } });
export default store;
export const { setBannerMessage, setBlogIds, clearBannerMessage, setVersion, setCurrentView, setColorScheme, updateBlogAgentData, login, signOut, setActiveBlogAgent, initializeBlogAgent, runAgent, addBlogAgent, setHtmlModal } = slice.actions;
// export const actions = { ...slice.actions};


