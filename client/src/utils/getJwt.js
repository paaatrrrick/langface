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

function deleteCookie(cookieName) {
  // Setting the cookie's expiry date to a time in the past will effectively delete it
  document.cookie = cookieName + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

const getUserAuthToken = () => {
    var userAuthToken = document.cookie.split(';').find(cookie => cookie.startsWith(`${constants.authCookieName}=`));
  if (!userAuthToken) {
    userAuthToken = document.cookie.split(';').find(cookie => cookie.startsWith(` ${constants.authCookieName}=`));
  }
  if (userAuthToken) {
    userAuthToken = userAuthToken.split('=')[1];
  }
  return userAuthToken;
}


async function createCheckoutSession() {
  const oauth = async () => {
    const response = await fetch(`${constants.url}/create-checkout-session`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    const session = await response.json();
    if (!session.url) {
      return false
    }
      // Open the Stripe Checkout Session in a new window
    const stripeWindow = window.open(session.url);

    // Return a new Promise that will resolve based on the Stripe Checkout Session result
    return new Promise((resolve) => {
      // Start a loop to check the URL of the new window
      const checkInterval = setInterval(() => {
        try {
          if (stripeWindow.location.href.includes('?success=true')) {
            stripeWindow.close();
            clearInterval(checkInterval);
            resolve(true);
            return;
          } else if (stripeWindow.location.href.includes('?canceled=true')) {
            stripeWindow.close();
            clearInterval(checkInterval);
            resolve(false);
            return;
          }
        } catch (error) {
          // This will throw an error when the Stripe Checkout Session is still in progress
          // and the new window is on a different domain. This is expected and okay.
        }

        // If the new window has been closed, stop checking
        if (stripeWindow.closed) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 500);  // Check every half second
    });
  }
  function pollUserPermissions() {
    return new Promise((resolve) => {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`${constants.url}/checkForNewBlog`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const blog = await response.json();
          if (blog.userID) {
            clearInterval(pollInterval);
            resolve(blog);
          }
        } catch (error) {
        }
      }, 2000);  // Check every 2 seconds
    });
  }
  const auth = await oauth();
  if (!auth) {
    return false;
  }
  const blog = await pollUserPermissions();
  return blog;
}



export { getJwt, wordpressGetJwt, deleteCookie, getUserAuthToken, createCheckoutSession };
