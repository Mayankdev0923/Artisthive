import SuperTokens from 'supertokens-auth-react';
import EmailPassword from 'supertokens-auth-react/recipe/emailpassword';
import Passwordless from 'supertokens-auth-react/recipe/passwordless';
import Session from 'supertokens-auth-react/recipe/session';

const apiDomain = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const websiteDomain = window.location.origin;

SuperTokens.init({
  appInfo: {
    appName: 'Artisthive',
    apiDomain,
    websiteDomain,
    apiBasePath: '/api/auth',
    websiteBasePath: '/auth',
  },
  recipeList: [
    EmailPassword.init(),
    Passwordless.init(),
    Session.init(),
  ],
});

export { SuperTokens, EmailPassword, Passwordless, Session };