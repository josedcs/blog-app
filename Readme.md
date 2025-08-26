## Assignment 
The application should have the following features:
- User authentication: The application should allow users to create an account and log in.
- Blog creation: Users should be able to write simple blog posts consisting of just plain text.
- Real-time notifications: Whenever a new blog is published by any user, all the users on the platform should be notified in real-time (without requiring a page reload) in the application itself.

To match our current technical stack, we prefer the solution using:
- Vue 3
- Node.js (preferred Nest.js)
- GraphQL

However, we will accept projects that use other tech stacks.

### Notes
- This project has been set up with Vue3 (Not Nuxt 3) and Nest.js with Graphql. It has a hello world graphql and REST endpoint.
- For the purposes of this project, please avoid Firebase and other Backend-as-a-Service tools because they abstract away too many implementation details for us to properly grade submissions.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

### Database Setup
1. Install and start PostgreSQL
2. Create a new database:
   ```sql
   CREATE DATABASE blog_app;
   ```
3. Create a `.env` file in the `backend` directory:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=blog_app
   JWT_SECRET=your-super-secret-jwt-key
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run start:dev
   ```
4. The GraphQL playground will be available at: `http://localhost:3200/graphql`

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. The application will be available at: `http://localhost:5173`

### Running Both Together
1. Start the backend first (in one terminal):
   ```bash
   cd backend
   npm run start:dev
   ```
2. Start the frontend (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`

### Features
- **User Authentication**: Register and login with JWT tokens
- **Blog Management**: Create, edit, publish, and unpublish blog posts
- **Real-time Updates**: Polling-based notifications for new posts
- **Responsive Design**: Works on desktop and mobile devices
- **GraphQL API**: Complete GraphQL schema with queries, mutations, and subscriptions

### API Endpoints
- **GraphQL Playground**: `http://localhost:3200/graphql`
- **Frontend Application**: `http://localhost:5173`

### Development
- Backend runs on port 3200
- Frontend runs on port 5173
- Database runs on default PostgreSQL port 5432
