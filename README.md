# Dev-Bug-Coder-Blog – A Full-Stack Developer Blog for Coding Errors & Solutions – React, Express, Prisma App

Dev-Bug-Coder-Blog is a full-stack blog platform where developers can document coding errors, share fixes, and learn from each other. It features authentication, real-time notifications, an admin dashboard, and a modern, responsive UI.

- **Live-Demo:** [https://dev-bug-coder-blog.vercel.app/](https://dev-bug-coder-blog.vercel.app/)

---

## 📚 Table of Contents

1. [Project Summary](#project-summary)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [How to Run Locally](#how-to-run-locally)
6. [Deployment](#deployment)
7. [Environment Variables](#environment-variables)
8. [API & Backend](#api--backend)
9. [Frontend Components](#frontend-components)
10. [How to Reuse Components](#how-to-reuse-components)
11. [Keywords](#keywords)
12. [Conclusion](#conclusion)

---

## Project Summary

Dev-Bug-Coder-Blog is a modern, full-stack developer blog platform for sharing real-world coding errors and their solutions. It empowers developers to post, discuss, and resolve bugs, fostering a collaborative learning environment. The project is designed for both practical use and as a teaching resource for full-stack development with React, Node.js, Express, Prisma (MongoDB), and Tailwind CSS.

---

## Features

- Post coding errors, solutions, code snippets, and screenshots
- Like, mark as helpful, comment, and report posts
- Save posts for later
- User authentication (JWT-based)
- Profile management (edit profile, avatar upload)
- Admin dashboard for reports
- Real-time notifications (likes, comments, helpful, reports)
- Responsive, modern UI (Tailwind CSS)
- Full REST API backend (Express, Prisma, MongoDB)
- File uploads (Multer)
- Secure routes and error handling

---

## Tech Stack

**Frontend:**

- React 18 (TypeScript)
- Vite
- Tailwind CSS
- Axios
- React Router DOM

**Backend:**

- Node.js
- Express.js
- Prisma ORM (MongoDB)
- Multer (file uploads)
- JWT (authentication)
- Nodemailer (email)

**Dev Tools:**

- ESLint, Prettier
- TypeScript
- Vercel (frontend deploy)
- Render (backend deploy)

---

## Project Structure

```bash
dev-bug-blog/
├── src/
│   ├── components/         # Reusable React components (PostCard, Sidebar, Navbar, LoadingSpinner, etc.)
│   ├── pages/              # Main app pages (Posts, PostDetails, CreatePost, EditProfile, AdminReports, etc.)
│   ├── api.ts              # Axios API logic and helpers
│   ├── types/              # TypeScript types
│   └── ...
├── routes/                 # Express backend routes (posts, comments, users, auth, reports, notifications)
├── middleware/             # Express middleware (authenticate)
├── prisma/
│   └── schema.prisma       # Prisma schema (MongoDB models)
├── public/                 # Static assets
├── uploads/                # Uploaded images/screenshots
├── server.js               # Express server entrypoint
├── package.json            # Project config and scripts
├── tailwind.config.js      # Tailwind CSS config
├── vite.config.ts          # Vite config
└── ...
```

---

## How to Run Locally

1. **Clone the repository:**

```sh
git clone https://github.com/arnobt78/dev-bug-blog.git
cd dev-bug-blog
```

2. **Install dependencies:**

```sh
npm install
```

3. **Set up environment variables:**

- Copy `.env.example` to `.env` and fill in your MongoDB URI, JWT secret, etc.

4. **Generate Prisma client:**

```sh
npx prisma generate
```

5. **Start the backend server:**

```sh
npm run dev:backend
```

6. **Start the frontend (Vite):**

```sh
npm run dev:frontend
```

7. **Visit the app:**

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000/api](http://localhost:5000/api)

---

## Deployment

- **Frontend:** Deploy to Vercel (recommended)
- **Backend:** Deploy to Render or any Node.js host
- **Environment:** Set all required environment variables in your deploy dashboard

---

## Environment Variables

Create a `.env` file in the root with:

```env

# Database Configuration
DATABASE_URL="your_mongodb_uri"

# JWT Configuration
JWT_SECRET="your_jwt_secret"

# Admin Configuration
ADMIN_EMAIL=your_admin_email@example.com
VITE_ADMIN_EMAIL=your_admin_email@example.com

# Email Configuration for SMTP Authentication
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password_or_generated_app_password

# Local Development URLs
PORT=5001
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5001
VITE_FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:5001
NODE_ENV=development

```

---

## API & Backend

### Main REST Endpoints (see `/routes/`)

- `GET /api/posts` — List all posts
- `GET /api/posts/:id` — Get post details
- `POST /api/posts` — Create post (auth, file upload)
- `PUT /api/posts/:id` — Edit post (auth)
- `DELETE /api/posts/:id` — Delete post (auth)
- `POST /api/posts/:id/like` — Toggle like (auth)
- `POST /api/posts/:id/helpful` — Toggle helpful (auth)
- `POST /api/posts/:id/save` — Save post (auth)
- `POST /api/posts/:id/unsave` — Unsave post (auth)
- `POST /api/comments/post/:postId` — Add comment (auth)
- `PUT /api/comments/:id` — Edit comment (auth)
- `DELETE /api/comments/:id` — Delete comment (auth)
- `POST /api/comments/:id/like` — Toggle comment like (auth)
- `POST /api/comments/:id/helpful` — Toggle comment helpful (auth)
- `GET /api/users/me/saved-posts` — Get saved posts (auth)
- `GET /api/notifications` — Get notifications (auth)
- `POST /api/notifications/mark-all-read` — Mark all notifications as read (auth)
- `POST /api/reports` — Report post (auth)

### Prisma Schema (see `/prisma/schema.prisma`)

- **User, Post, Comment, SavedPost, Like, Helpful, Report, Notification** models
- MongoDB as the database
- Relations: users <-> posts <-> comments, likes, helpful, saved, reports, notifications

---

## Frontend Components

All UI is built from reusable React components in `/src/components/`:

- `PostCard` — Displays a post with actions (like, helpful, save, report, etc.)
- `Sidebar` — Tag selector, recent posts, popular topics
- `Navbar` — Top navigation, search, user menu, notifications
- `CommentSection` — Nested comments, add/edit/delete, like/helpful
- `LoadingSpinner` — Animated loading overlay (customizable text)
- `TagSelector`, `PostHeader`, `PostStats`, `PostActionsBar`, `PostDropdownMenu`, etc.

### Example: Using the LoadingSpinner

```tsx
import LoadingSpinner from "./components/LoadingSpinner";
<LoadingSpinner text="Loading..." />;
```

---

## How to Reuse Components

1. **Copy any component** from `/src/components/` into your own React project
2. **Import and use** as shown in the example above
3. **API logic** in `/src/api.ts` is reusable for any REST backend
4. **TypeScript types** in `/src/types/` help with type safety
5. **Follow the folder structure** for scalable, maintainable apps

---

## Keywords

`developer blog`, `coding errors`, `bug fixes`, `React`, `Node.js`, `MongoDB`, `Prisma`, `Express`, `Vite`, `Tailwind CSS`, `JWT`, `REST API`, `full stack`, `community`, `notifications`, `admin`, `report`, `save post`, `comment`, `like`, `helpful`, `tag`, `search`, `responsive`, `modern`, `open source`

---

## Conclusion

This project is a complete, real-world example of a modern full-stack application. It’s designed for both practical use and as a learning resource. Study the code, experiment, and extend it for your own needs. Every feature is built with reusability, scalability, and developer experience in mind.

---

## Happy Coding! 🎉

Feel free to use this project repository and extend this project further!

If you have any questions or want to share your work, reach out via GitHub or my portfolio at [https://arnob-mahmud.vercel.app/](https://arnob-mahmud.vercel.app/).

**Enjoy building and learning!** 🚀

Thank you! 😊

---
