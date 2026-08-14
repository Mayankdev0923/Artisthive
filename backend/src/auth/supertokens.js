import supertokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Passwordless from 'supertokens-node/recipe/passwordless';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { config } from '../config/index.js';

supertokens.init({
  framework: 'express',
  supertokens: {
    connectionURI: config.supertokens.connectionURI,
    apiKey: config.supertokens.apiKey,
  },
  appInfo: {
    appName: 'Artisthive',
    apiDomain: config.supertokens.apiDomain,
    websiteDomain: config.supertokens.websiteDomain,
    apiBasePath: '/api/auth',
    websiteBasePath: '/auth',
  },
  recipeList: [
    EmailPassword.init(),
    Passwordless.init({
      flowType: 'USER_INPUT_CODE_AND_MAGIC_LINK',
      contactMethod: 'EMAIL',
      emailDelivery: {
        override: () => (input) => sendOtpEmail(input.email, input.urlWithLinkCode),
      },
    }),
    Session.init(),
  ],
});

import { sendOtpEmail } from '../utils/email.js';

export { supertokens, Session, EmailPassword, Passwordless, verifySession };
