require('dotenv').config();

function splitCsv(value) {
  if (!value) return [];
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  corsAllowedOrigins: splitCsv(process.env.CORS_ALLOWED_ORIGINS) || [],

  // Auth
  jwtSecret: process.env.JWT_SECRET,

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // Email
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET_DEV,
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Admin emails
  adminEmails: splitCsv(process.env.ADMIN_EMAILS),
};

const requiredVars = ['jwtSecret', 'databaseUrl'];
if (config.stripe.secretKey) requiredVars.push('stripe.secretKey');
if (config.stripe.webhookSecret) requiredVars.push('stripe.webhookSecret');

requiredVars.forEach((key) => {
  const value = key.includes('.') 
    ? key.split('.').reduce((o, k) => o?.[k], config) 
    : config[key];

  if (!value) throw new Error(`Missing required config: ${key}`);
});


module.exports = config;


