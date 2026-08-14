import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  supertokens: {
    connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || 'http://localhost:3567',
    apiKey: process.env.SUPERTOKENS_API_KEY || '',
    websiteDomain: process.env.SUPERTOKENS_WEBSITE_DOMAIN || 'http://localhost:5173',
    apiDomain: process.env.SUPERTOKENS_API_DOMAIN || 'http://localhost:4000',
  },

  databaseUrl: process.env.DATABASE_URL || '',

  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',

  email: {
    from: process.env.OTP_EMAIL_FROM || 'Artisthive <no-reply@yourdomain.com>',
    provider: process.env.EMAIL_API_PROVIDER || 'resend',
    resendApiKey: process.env.RESEND_API_KEY || '',
    brevoApiKey: process.env.BREVO_API_KEY || '',
  },

  media: {
    dir: process.env.MEDIA_DIR || './media',
    publicBaseUrl: process.env.PUBLIC_MEDIA_BASE_URL || 'http://localhost:4000/media',
  },

  corsOrigins: [
    process.env.SUPERTOKENS_WEBSITE_DOMAIN || 'http://localhost:5173',
    process.env.SUPERTOKENS_ADMIN_DOMAIN || 'http://localhost:5174',
  ],
};