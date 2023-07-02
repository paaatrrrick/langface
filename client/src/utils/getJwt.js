import constants from "../constants";

const getJwt = async (setToken, setError) => {
  var oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";
  var params = {
    client_id:
      "704178374790-ifgbedjlnfm7cpgjrdju7n1psbmm88j8.apps.googleusercontent.com",
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
      const url = newWin.location.href;
      try {
        if (newWin.location.href.includes("access_token")) {
          clearInterval(tokenCheckInterval);
          const newWinURI = newWin.location.href;
          const token = newWinURI.substring(
            newWinURI.indexOf("access_token=") + 13,
            newWinURI.indexOf("&token_type")
          );
          newWin.close();
          setToken(token);
          return;
        }
      } catch (e) {
        setError("Failed to login with Google. Please try again.");
        return null;
      }
    } catch (e) {}
  }, 50);
};

export default getJwt;

const wordpressGetJwt = async (setError, fetchWordpress) => {
  const client_id = constants.WP_CLIENT_ID;
  const redirect_url = constants.localUrl;
  const url = `https://public-api.wordpress.com/oauth2/authorize?client_id=${client_id}&redirect_uri=${redirect_url}&response_type=code`;
  const newWin = window.open(url, "_blank");
  const tokenCheckInterval = setInterval(() => {
    try {
      const url = newWin.location.href;
      try {
        if (newWin?.location?.href && newWin.location.href.includes("code")) {
          clearInterval(tokenCheckInterval);
          const urlObj = new URL(newWin.location.href);
          const params = new URLSearchParams(urlObj.search);
          const code = params.get("code");
          newWin.close();
          fetchWordpress(code);
          return;
        }
      } catch (e) {
        setError("Failed to login with Wordpress. Please try again.");
        return null;
      }
    } catch (e) {}
  }, 500);
};

export { getJwt, wordpressGetJwt };
