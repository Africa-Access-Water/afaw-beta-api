# Africa Access Water - Backend API

A Node.js/Express backend API for the Africa Access Water platform, featuring authentication, donations, blog management, and team management.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Update the `.env` file with your actual configuration values:

#### Required Environment Variables:

**Database:**

- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Set to "development" for local development

**Authentication:**

- `JWT_SECRET` - Secret key for JWT token signing

**Payment Processing (Stripe):**

- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret (fallback: `STRIPE_WEBHOOK_SECRET_DEV` in non-prod)
- `CLIENT_URL` - Frontend URL for payment redirects

**Email Service:**

- `EMAIL_HOST` - SMTP server host
- `EMAIL_PORT` - SMTP server port
- `EMAIL_USER` - Email account username
- `EMAIL_PASS` - Email account password/app password

**File Storage (Cloudinary):**

- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### 3. Database Setup

The project uses PostgreSQL with Knex.js for migrations.

1. Create a PostgreSQL database
2. Update your `DATABASE_URL` in the `.env` file
3. Run migrations:

```bash
npm run migrate
```

### 4. Start the Server

For development with auto-reload:

```bash
npm run dev
```

For production:

```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## 📁 Project Structure

```
├── config/          # Database configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── migrations/      # Database migrations
├── models/          # Data models
├── routes/          # API routes
├── services/        # External services (email, etc.)
├── test-forms/      # HTML test forms for API testing
├── utils/           # Utility functions
├── server.js        # Main server file
└── knexfile.js      # Knex configuration
```

## 🛠 API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Donations

- `POST /api/donations/checkout` - Create Stripe checkout session
- `POST /api/donations/subscribe` - Create recurring donation
- `POST /api/donations/webhook` - Stripe webhook handler
- `GET /api/donations` - Get all donations
- `GET /api/donations/donors` - Get all donors

### Blog Management

- `GET /api/blogs` - Get all blog posts
- `POST /api/blogs` - Create blog post (with file upload)
- `PUT /api/blogs/:id` - Update blog post
- `DELETE /api/blogs/:id` - Delete blog post

### Posts Management

- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post (with file upload)
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Team Management

- `GET /api/teams` - Get all team members
- `POST /api/teams` - Add team member (with file upload)
- `PUT /api/teams/:id` - Update team member
- `DELETE /api/teams/:id` - Delete team member

### Contact

- `POST /api/contact` - Send contact form email

## 🧪 Testing

Test forms are available in the `test-forms/` directory for manual API testing:

- Authentication: `test-forms/auth/`
- Donations: `test-forms/donations/`
- Blog: `test-forms/blog.html`
- Posts: `test-forms/post.html`
- Team: `test-forms/team.html`
- Contact: `test-forms/contact.html`

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations
- `npm start` - Start production server (runs migrations first)

### Database Migrations

To create a new migration:

```bash
npx knex migrate:make migration_name --knexfile knexfile.js
```

To run migrations:

```bash
npm run migrate
```

## 🚀 Deployment

1. Set up your production database
2. Configure all environment variables
3. Run migrations: `npm run migrate`
4. Start the server: `npm start`

## 📝 Notes

- The server includes CORS middleware for cross-origin requests
- File uploads are handled via Cloudinary
- Payment processing uses Stripe
- Email functionality uses Nodemailer with SMTP
- Authentication uses JWT tokens
- Database uses PostgreSQL with Knex.js ORM
