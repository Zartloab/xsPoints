# Architecture Overview

## Overview

xPoints Exchange is a full-stack web application that allows users to exchange loyalty points between different programs (Qantas, GYG) using a universal currency called xPoints. The application follows a client-server architecture with a React frontend and an Express.js backend, using PostgreSQL for data persistence.

The application is designed to be deployed on Replit, as evidenced by the `.replit` configuration file and Replit-specific plugins. The codebase is organized into distinct client, server, and shared directories to maintain separation of concerns.

## System Architecture

### High-Level Architecture

The application follows a modern three-tier architecture:

1. **Presentation Layer**: React-based single-page application (SPA) with Tailwind CSS and Shadcn UI components
2. **Application Layer**: Express.js server handling API requests, authentication, and business logic
3. **Data Layer**: PostgreSQL database accessed through Drizzle ORM

### Directory Structure

```
├── client/               # Frontend React application
│   ├── index.html        # Entry HTML file
│   └── src/              # React source code
│       ├── components/   # UI components organized by feature
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utility functions and configuration
│       └── pages/        # Page components corresponding to routes
├── server/               # Backend Express application
│   ├── auth.ts           # Authentication logic
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database access layer
│   └── vite.ts           # Vite development server integration
├── shared/               # Code shared between frontend and backend
│   └── schema.ts         # Database schema and type definitions
└── migrations/           # Database migrations (generated by Drizzle)
```

## Key Components

### Frontend

1. **React SPA**: The client-side application is built using React with TypeScript, managed through Vite for fast development and efficient bundling.

2. **Component Library**: Uses Shadcn UI, a collection of accessible UI components built on Radix UI primitives, styled with Tailwind CSS.

3. **State Management**: Uses React Context API for global state management (authentication) and React Query for server state management.

4. **Routing**: Uses Wouter for lightweight client-side routing.

5. **Form Handling**: Uses React Hook Form with Zod for validation.

### Backend

1. **Express.js Server**: The backend is built using Express.js with TypeScript, providing HTTP API endpoints for the client.

2. **Authentication**: Uses Passport.js with a local strategy for session-based authentication. Sessions are stored in a PostgreSQL session store.

3. **Database Access**: Uses Drizzle ORM for typesafe database access.

4. **API Routes**: RESTful API endpoints for user management, wallet operations, transactions, and exchange rates.

### Database Schema

The database schema consists of the following tables:

1. **users**: Stores user account information including authentication and KYC status.
2. **wallets**: Manages user loyalty program accounts, balances, and account connections.
3. **transactions**: Records point exchanges between different loyalty programs.
4. **exchange_rates**: Stores current exchange rates between different loyalty programs.

Key relationships:
- Each user can have multiple wallets (one per loyalty program)
- Transactions are linked to users and specify source and destination loyalty programs

## Data Flow

### Authentication Flow

1. User registers/logs in through the `/api/register` or `/api/login` endpoints
2. Server validates credentials and creates a session
3. Session ID is stored in a cookie on the client
4. Subsequent API requests include the session cookie for authentication
5. Protected routes check for valid session before processing requests

### Points Exchange Flow

1. User selects source and destination loyalty programs and amount to convert
2. Client requests exchange rate from `/api/exchange-rates` endpoint
3. User confirms the exchange
4. Server validates the request, checks wallet balances
5. Server processes the transaction, updating source and destination wallet balances
6. Server creates a transaction record
7. Updated wallet information is returned to the client

### Account Linking Flow

1. User provides loyalty program credentials through the account linking form
2. Server validates the credentials with the respective loyalty program API
3. On successful validation, server creates or updates a wallet for the user
4. Wallet balances are synchronized with the external loyalty program

## External Dependencies

### Frontend Dependencies

- **UI Framework**: React with TypeScript
- **Styling**: Tailwind CSS with the New York style from Shadcn UI
- **Component Library**: Radix UI primitives with Shadcn UI components
- **Data Fetching**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Wouter

### Backend Dependencies

- **Server Framework**: Express.js
- **Authentication**: Passport.js with local strategy
- **Database ORM**: Drizzle ORM
- **Database Connector**: @neondatabase/serverless for PostgreSQL
- **Session Management**: express-session with connect-pg-simple

### Development Dependencies

- **Build Tool**: Vite with TypeScript configuration
- **Bundling**: ESBuild for production build
- **Formatting & Styling**: Prettier, ESLint
- **Database Migration**: Drizzle Kit

## Deployment Strategy

The application is configured for deployment on Replit, with specific configuration in the `.replit` file:

1. **Development Mode**: `npm run dev` starts both the Vite development server and the Express backend
2. **Production Build**: `npm run build` generates static assets and bundles the server
3. **Production Start**: `npm run start` runs the production server from the dist directory

The deployment process is managed by Replit's infrastructure with the following steps:

1. **Build Step**: `npm run build` compiles both client and server code
2. **Start Command**: `npm run start` runs the production server
3. **Port Configuration**: The server listens on port 5000 but is exposed externally on port 80

### Database Deployment

The application uses Neon PostgreSQL, as indicated by the `@neondatabase/serverless` dependency. The database connection string is expected to be provided via the `DATABASE_URL` environment variable.

Database schema is managed using Drizzle ORM with migrations:

1. **Schema Definition**: In `shared/schema.ts`
2. **Migration Generation**: Using `drizzle-kit` to create migration files
3. **Migration Application**: Using `npm run db:push` to apply schema changes

## Security Considerations

1. **Authentication**: Password hashing using scrypt with salt for secure password storage
2. **Session Management**: HTTP-only cookies with secure flag in production
3. **CSRF Protection**: Implemented through SameSite cookie policy
4. **Input Validation**: Using Zod schemas for request validation

## Future Extension Points

1. **Additional Loyalty Programs**: The system is designed to easily add new loyalty programs through the enum-based program type
2. **Enhanced KYC**: The user table includes a KYC verification status field for future KYC implementation
3. **Fee Structure**: The transaction table includes a fee field for implementing transaction fees
4. **Mobile Apps**: The API-first approach allows for future mobile client development