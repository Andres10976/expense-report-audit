export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_TENANT_ID}`,
    redirectUri: process.env.REACT_APP_REDIRECT_URI,
    postLogoutRedirectUri: `${window.location.origin}/login`,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  }
};

export const loginRequest = {
  scopes: [
    "User.Read",
    "User.Read.All",
    "Sites.Read.All",
    "Sites.ReadWrite.All",
    "Files.ReadWrite.All",
  ],
};

export const logoutRequest = {
  postLogoutRedirectUri: window.location.origin,
  mainWindowRedirectUri: window.location.origin
};