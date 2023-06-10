const TESTING = true;
const constants = {
  url: TESTING ? "http://localhost:8000" : "https://langface.up.railway.app",
  localUrl: TESTING ? "http://localhost:3000" : "https://langface.ai",
  WP_CLIENT_ID: 87563,
  WP_REDIRECT_URI: TESTING ? "http://localhost:3000" : "https://langface.ai",
};

export default constants;
