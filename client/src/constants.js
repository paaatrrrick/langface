const TESTING = (process.env.REACT_APP_RUNNING_LOCAL === "true");
const constants = {
  url: TESTING ? "http://localhost:8000" : "https://langface.up.railway.app",
  localUrl: TESTING ? "http://localhost:3000" : "https://langface.ai",
  WP_CLIENT_ID: 87563,
  GOOGLE_CLIENT_ID: "406198750695-i6p3k9r380io0tlre38j8jsvv2o4vmk7.apps.googleusercontent.com"
};

export default constants;
