import constants from "../constants";

const getJwt = async (setToken, setError) => {
  var oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";
  var params = {
    // 'client_id': '406198750695-i6p3k9r380io0tlre38j8jsvv2o4vmk7.apps.googleusercontent.com',
    client_id:
      "704178374790-ifgbedjlnfm7cpgjrdju7n1psbmm88j8.apps.googleusercontent.com",
    // 'client_id': '654856777688-mjq8db4r06oiseq0fffu7co3cdmbheq3.apps.googleusercontent.com',
    // 'client_id': '17461614817-5t83skk10v7oodivj19g8k6numghbbo0.apps.googleusercontent.com',
    redirect_uri: constants.localUrl,
    response_type: "token",
    scope: "https://www.googleapis.com/auth/blogger",
    include_granted_scopes: "true",
    state: "pass-through value",
  };
  var url =
    oauth2Endpoint +
    "?" +
    Object.keys(params)
      .map((k) => `${k}=${encodeURIComponent(params[k])}`)
      .join("&");
  const newWin = window.open(url, "_blank");
  var tokenCheckInterval = setInterval(() => {
    try {
      if (newWin.location.href.includes("access_token")) {
        clearInterval(tokenCheckInterval);
        const newWinURI = newWin.location.href;
        const token = newWinURI.substring(
          newWinURI.indexOf("access_token=") + 13,
          newWinURI.indexOf("&token_type")
        );
        newWin.close();
        console.log(token);
        setToken(token);
        return token;
      }
    } catch (e) {
      console.log("we got an error");
      setError("Failed to login with Google. Please try again.");
      return null;
    }
  }, 50);
};

export default getJwt;

const wordpressGetJwt = async (setToken, setError, fetchWordpress) => {
  const state = Math.random().toString(36).substring(7); // This is a simple example, consider using a more robust method
  localStorage.setItem("oauth2_state", state); // Storing in localStorage as an example, consider more secure options in a production app
  const client_id = constants.WP_CLIENT_ID;
  const redirect_url = constants.WP_REDIRECT_URI;
  const url = `https://public-api.wordpress.com/oauth2/authorize?client_id=${client_id}&redirect_uri=${redirect_url}&response_type=code`;
  const newWin = window.open(url, "_blank");
  const tokenCheckInterval = setInterval(() => {
    try {
      const url = newWin.location.href;
      try {
        if (newWin?.location?.href && newWin.location.href.includes("code")) {
          console.log("4");
          console.log("we are in");
          clearInterval(tokenCheckInterval);
          const urlObj = new URL(newWin.location.href);
          const params = new URLSearchParams(urlObj.search);
          const code = params.get("code");
          newWin.close();
          console.log(code);
          setToken(code);
          console.log("about to fecth");
          fetchWordpress(code);
          return code;
        }
      } catch (e) {
        setError("Failed to login with Wordpress. Please try again.");
        return null;
      }
    } catch (e) {}
  }, 50);
};

export { getJwt, wordpressGetJwt };
