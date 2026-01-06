# Developer's Blog Platform – Next.js, MongoDB, Prisma, TanStack React Query FullStack Project (Blog for Coding Errors & Solutions)

A full-stack developer blog platform where programmers share real-world coding errors, bugs, and their solutions. Built with Next.js 16, React 19, TypeScript, MongoDB, Prisma, and TanStack React Query.

- **Live-Demo:** [https://dev-bug-coder-blog.vercel.app/](https://dev-bug-coder-blog.vercel.app/)

![Screenshot 2025-08-23 at 23 04 48](https://github.com/user-attachments/assets/d184b39a-e19d-48c4-8988-1b511b9f4924)
![Screenshot 2025-08-23 at 23 06 25](https://github.com/user-attachments/assets/eeccee97-96e5-4d14-90c4-015716f5ac8d)
![Screenshot 2025-08-23 at 23 06 52](https://github.com/user-attachments/assets/ea4cb0ab-0c2d-4e0b-a183-6fa0b785cbff)
![Screenshot 2025-08-23 at 23 07 50](https://github.com/user-attachments/assets/988809c2-69a7-46ee-b7ed-e6368a30e29e)
![Screenshot 2025-08-23 at 23 08 07](https://github.com/user-attachments/assets/ef6130cb-0411-4c81-b7de-d0e05abfc4c9)
![Screenshot 2025-08-23 at 23 08 25](https://github.com/user-attachments/assets/3b8bc105-f1a4-4c23-84d3-329d9fff0d45)
![Screenshot 2025-08-23 at 23 08 44](https://github.com/user-attachments/assets/e92de0c7-150c-4b4e-bc14-29630ab3e0e6)
![Screenshot 2025-08-23 at 23 09 00](https://github.com/user-attachments/assets/b1702db5-8fab-4191-8cd4-01caaa3269a6)
![Screenshot 2025-08-23 at 23 09 21](https://github.com/user-attachments/assets/0b6b151f-c5aa-49cb-a657-b93e4371856c)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Installation & Setup](#-installation--setup)
- [Running the Project](#-running-the-project)
- [API Endpoints](#-api-endpoints)
- [Components Documentation](#-components-documentation)
- [Custom Hooks](#-custom-hooks)
- [Database Schema](#-database-schema)
- [Reusing Components](#-reusing-components)
- [Deployment](#-deployment)
- [Keywords](#-keywords)
- [Conclusion](#-conclusion)

---

## 🎯 Overview

Dev-Bug-Coder-Blog is a modern, full-stack blogging platform designed for developers to share coding errors, bugs, and solutions. It features real-time interactions, optimistic UI updates, nested comments, image uploads, and a comprehensive notification system.

### Key Highlights

- **Server-Side Rendering (SSR)** with Next.js App Router
- **Client-Side Rendering (CSR)** with React Query for instant updates
- **Optimistic Updates** for seamless user experience
- **Real-time Notifications** system
- **Nested Comments** with threading support
- **Image Upload** with ImageKit integration
- **Authentication** with JWT tokens
- **Responsive Design** with Tailwind CSS

---

## ✨ Features

### Core Functionality

- **User Authentication**

  - Registration with avatar upload
  - Login/Logout
  - Password reset via email
  - JWT-based session management

- **Post Management**

  - Create, edit, and delete posts
  - Rich text content with code snippets
  - Image/screenshot uploads
  - Tag system for categorization
  - Like and helpful marks
  - Save/unsave posts

- **Comments System**

  - Nested comment threads
  - Reply to comments
  - Like comments
  - Edit and delete own comments
  - Image uploads in comments

- **Notifications**

  - Real-time notifications for interactions
  - Mark as read/unread
  - Notification count badge

- **Search & Filter**

  - Search posts by title, content, tags
  - Filter by tags
  - Recent posts sidebar
  - Popular topics

- **Admin Features**
  - View and manage reported posts
  - Admin dashboard

---

## 🛠 Technology Stack

### Frontend

- **Next.js 16.1.1** - React framework with App Router
- **React 19.0.0** - UI library
- **TypeScript 5.8.3** - Type safety
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **TanStack React Query 5.62.8** - Data fetching and caching
- **ShadCN UI** - Reusable component library
- **Radix UI** - Accessible component primitives

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Prisma 6.19.1** - Type-safe ORM
- **MongoDB** - NoSQL database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### Services & Tools

- **ImageKit** - Image hosting and optimization
- **Nodemailer** - Email sending (password reset)
- **React Icons** - Icon library
- **Lucide React** - Additional icons

---

## 📁 Project Structure

```bash
dev-blog/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── posts/                # Post CRUD operations
│   │   ├── comments/             # Comment operations
│   │   ├── notifications/        # Notification endpoints
│   │   ├── upload/               # Image upload
│   │   └── users/                # User endpoints
│   ├── (pages)/                  # Public pages
│   │   ├── page.tsx              # Home page
│   │   ├── posts/                # Posts listing
│   │   ├── post/[id]/            # Post details
│   │   ├── login/                # Login page
│   │   ├── register/             # Registration page
│   │   ├── create-post/          # Create post
│   │   ├── edit-post/[id]/       # Edit post
│   │   ├── saved-posts/          # Saved posts
│   │   ├── notifications/        # Notifications page
│   │   └── admin/                # Admin pages
│   └── layout.tsx                # Root layout
├── components/                    # React components
│   ├── ui/                       # ShadCN UI components
│   ├── providers/                 # Context providers
│   └── (feature components)      # Feature-specific components
├── hooks/                         # Custom React hooks
│   ├── use-posts.ts              # Post operations
│   ├── use-auth.ts               # Authentication
│   ├── use-comments.ts           # Comments
│   └── use-notifications.ts      # Notifications
├── lib/                          # Utility libraries
│   ├── prisma.ts                 # Prisma client
│   ├── query-client.ts           # React Query config
│   ├── imagekit.ts               # ImageKit integration
│   └── utils.ts                  # Helper functions
├── types/                         # TypeScript types
├── prisma/                       # Database schema
│   └── schema.prisma
└── public/                       # Static assets
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **MongoDB** database (local or cloud)
- **ImageKit** account (for image uploads)
- **Gmail** account (for email sending)

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
# MongoDB connection string
# Format: mongodb://username:password@host:port/database?authSource=admin
DATABASE_URL="mongodb://localhost:27017/dev-blog"

# JWT Secret
# Generate a secure random string (minimum 256 characters recommended)
# You can generate one using: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Admin Configuration
# Email address for admin user (exposed to client for admin checks)
NEXT_PUBLIC_ADMIN_EMAIL="admin@example.com"

# Email Configuration (for password reset)
# Gmail SMTP credentials
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-specific-password"

# ImageKit Configuration
# Get these from your ImageKit dashboard
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="your-imagekit-public-key"
IMAGEKIT_PRIVATE_KEY="your-imagekit-private-key"
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-imagekit-id"
```

### How to Get Environment Variables

#### 1. MongoDB Connection String

**Local MongoDB:**

```env
DATABASE_URL="mongodb://localhost:27017/dev-blog"
```

**MongoDB Atlas (Cloud):**

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string from "Connect" button
4. Replace `<password>` with your database password

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/dev-blog?retryWrites=true&w=majority"
```

#### 2. JWT Secret

Generate a secure random string:

```bash
# Using OpenSSL
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 3. Gmail App Password (for Email)

1. Enable 2-Factor Authentication on your Google Account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Create a new app password for "Mail"
4. Use this password in `EMAIL_PASS`

#### 4. ImageKit Credentials

1. Sign up at [ImageKit](https://imagekit.io/)
2. Create a new project
3. Get credentials from Dashboard → Developer Options
4. Copy Public Key, Private Key, and URL Endpoint

---

## 📦 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd dev-blog
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in all required environment variables (see [Environment Variables](#-environment-variables) section)

### Step 4: Set Up Database

1. **Start MongoDB** (if using local):

   ```bash
   # macOS (using Homebrew)
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod

   # Windows
   # Start MongoDB service from Services panel
   ```

2. **Generate Prisma Client**:

   ```bash
   npm run prisma:generate
   ```

3. **Push Database Schema**:

   ```bash
   npm run prisma:push
   ```

   This creates all tables/collections in your MongoDB database.

### Step 5: Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 🏃 Running the Project

### Development Mode

```bash
npm run dev
```

Runs the app in development mode with Turbopack for faster builds.

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Other Commands

```bash
# Lint code
npm run lint

# Generate Prisma Client
npm run prisma:generate

# Push database schema changes
npm run prisma:push
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint                    | Description               |
| ------ | --------------------------- | ------------------------- |
| POST   | `/api/auth/register`        | Register new user         |
| POST   | `/api/auth/login`           | Login user                |
| GET    | `/api/auth/validate`        | Validate JWT token        |
| GET    | `/api/auth/me`              | Get current user          |
| POST   | `/api/auth/forgot-password` | Request password reset    |
| POST   | `/api/auth/reset-password`  | Reset password with token |

### Posts

| Method | Endpoint                  | Description                  |
| ------ | ------------------------- | ---------------------------- |
| GET    | `/api/posts`              | Get all posts (with filters) |
| GET    | `/api/posts/[id]`         | Get single post              |
| POST   | `/api/posts`              | Create new post              |
| PUT    | `/api/posts/[id]`         | Update post                  |
| DELETE | `/api/posts/[id]`         | Delete post                  |
| POST   | `/api/posts/[id]/like`    | Like/unlike post             |
| POST   | `/api/posts/[id]/helpful` | Mark post as helpful         |
| POST   | `/api/posts/[id]/save`    | Save post                    |
| POST   | `/api/posts/[id]/unsave`  | Unsave post                  |
| POST   | `/api/posts/[id]/report`  | Report post                  |

### Comments

| Method | Endpoint                      | Description             |
| ------ | ----------------------------- | ----------------------- |
| GET    | `/api/comments/post/[postId]` | Get comments for post   |
| POST   | `/api/comments/post/[postId]` | Create comment          |
| PUT    | `/api/comments/[id]`          | Update comment          |
| DELETE | `/api/comments/[id]`          | Delete comment          |
| POST   | `/api/comments/[id]/like`     | Like/unlike comment     |
| POST   | `/api/comments/[id]/helpful`  | Mark comment as helpful |

### Notifications

| Method | Endpoint                            | Description               |
| ------ | ----------------------------------- | ------------------------- |
| GET    | `/api/notifications`                | Get user notifications    |
| PUT    | `/api/notifications/[id]/mark-read` | Mark notification as read |
| PUT    | `/api/notifications/mark-all-read`  | Mark all as read          |
| DELETE | `/api/notifications/[id]`           | Delete notification       |

### Upload

| Method | Endpoint      | Description              |
| ------ | ------------- | ------------------------ |
| POST   | `/api/upload` | Upload image to ImageKit |

### Users

| Method | Endpoint                    | Description         |
| ------ | --------------------------- | ------------------- |
| GET    | `/api/users/me/saved-posts` | Get saved posts     |
| PUT    | `/api/users/me`             | Update user profile |

---

## 🧩 Components Documentation

### Core Components

#### PostCard

Displays a post card with all interactions.

```tsx
import PostCard from "@/components/PostCard";

<PostCard
  post={{
    id: "post-id",
    title: "Post Title",
    description: "Description",
    // ... other post fields
  }}
  saved={false}
  onUnsave={(postId) => {
    /* handle unsave */
  }}
  onDelete={(postId) => {
    /* handle delete */
  }}
  onLikeHelpfulUpdate={(postId, data) => {
    /* handle update */
  }}
/>;
```

**Props:**

- `post`: Post object with all post data
- `saved`: Boolean indicating if post is saved
- `onUnsave`: Callback when post is unsaved
- `onDelete`: Callback when post is deleted
- `onLikeHelpfulUpdate`: Callback for like/helpful updates

#### CommentSection

Nested comment system with replies.

```tsx
import CommentSection from "@/components/CommentSection";

<CommentSection
  postId="post-id"
  parentId="comment-id" // Optional: for nested replies
/>;
```

**Props:**

- `postId`: ID of the post
- `parentId`: Optional parent comment ID for nested replies

#### ConfirmDialog

Reusable confirmation dialog (replaces `window.confirm`).

```tsx
import { ConfirmDialog } from "@/components/ConfirmDialog";

const [showConfirm, setShowConfirm] = useState(false);

<ConfirmDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  title="Delete Post"
  description="Are you sure you want to delete this post?"
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={() => deletePost()}
  variant="destructive" // "default" | "destructive"
/>;
```

#### InputDialog

Reusable input dialog (replaces `window.prompt`).

```tsx
import { InputDialog } from "@/components/InputDialog";

const [showDialog, setShowDialog] = useState(false);

<InputDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  title="Report Post"
  description="Why are you reporting this post?"
  placeholder="Enter reason..."
  onConfirm={(value) => reportPost(value)}
  type="textarea" // "text" | "textarea"
/>;
```

### UI Components (ShadCN)

All UI components are in `components/ui/`:

- `skeleton.tsx` - Loading skeletons
- `toast.tsx` - Toast notifications
- `dialog.tsx` - Dialog component
- `alert-dialog.tsx` - Alert dialog component

---

## 🎣 Custom Hooks

### usePosts

Fetch and manage posts with React Query.

```tsx
import { usePosts, usePost, useCreatePost } from "@/hooks/use-posts";

// Fetch all posts
const { data: posts, isLoading } = usePosts({
  tag: "react", // Optional filter
  search: "error", // Optional search
});

// Fetch single post
const { data: post } = usePost("post-id");

// Create post
const createPost = useCreatePost();
createPost.mutate(formData);
```

**Available Hooks:**

- `usePosts()` - Get all posts
- `usePost(id)` - Get single post
- `useSavedPosts()` - Get saved posts
- `useCreatePost()` - Create post mutation
- `useUpdatePost()` - Update post mutation
- `useDeletePost()` - Delete post mutation
- `useLikePost()` - Like/unlike mutation (optimistic)
- `useMarkHelpful()` - Mark helpful mutation (optimistic)
- `useSavePost()` - Save post mutation
- `useUnsavePost()` - Unsave post mutation

### useAuth

Authentication hooks.

```tsx
import { useAuth, useLogin, useLogout } from "@/hooks/use-auth";

// Check authentication
const { data: authData } = useAuth();
const user = authData?.user;
const isLoggedIn = !!user;

// Login
const login = useLogin();
login.mutate({ email: "user@example.com", password: "password" });

// Logout
const logout = useLogout();
logout.mutate();
```

**Available Hooks:**

- `useAuth()` - Get current user
- `useLogin()` - Login mutation
- `useRegister()` - Register mutation
- `useLogout()` - Logout mutation
- `useUpdateProfile()` - Update profile mutation
- `useRequestPasswordReset()` - Request password reset
- `useResetPassword()` - Reset password with token

### useComments

Comment management hooks.

```tsx
import { useComments, useCreateComment } from "@/hooks/use-comments";

// Fetch comments
const { data: comments } = useComments("post-id");

// Create comment
const createComment = useCreateComment();
createComment.mutate({
  postId: "post-id",
  content: "Comment text",
  parentId: "parent-comment-id", // Optional: for replies
});
```

**Available Hooks:**

- `useComments(postId)` - Get comments for post
- `useCreateComment()` - Create comment mutation
- `useUpdateComment()` - Update comment mutation
- `useDeleteComment()` - Delete comment mutation
- `useLikeComment()` - Like/unlike comment (optimistic)

### useNotifications

Notification hooks.

```tsx
import {
  useNotifications,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";

// Fetch notifications
const { data: notifications } = useNotifications();

// Mark all as read
const markAllRead = useMarkAllNotificationsRead();
markAllRead.mutate();
```

**Available Hooks:**

- `useNotifications()` - Get notifications (auto-refetches every 2 minutes)
- `useUnreadCount()` - Get unread count
- `useMarkNotificationRead()` - Mark single as read
- `useMarkAllNotificationsRead()` - Mark all as read
- `useDeleteNotification()` - Delete notification

### useImageUpload

Image upload hook.

```tsx
import { useImageUpload } from "@/hooks/use-image-upload";

const { uploadImage, uploading, progress } = useImageUpload();

const handleUpload = async () => {
  const result = await uploadImage(file, "posts");
  if (result) {
    console.log(result.url); // Image URL
    console.log(result.fileId); // ImageKit file ID
  }
};
```

---

## 🗄 Database Schema

### Models

#### User

- `id`: String (ObjectId)
- `name`: String
- `email`: String (unique)
- `password`: String (hashed)
- `country`: String (optional)
- `avatarUrl`: String (optional)
- `resetToken`: String (optional)
- `resetTokenExpiry`: DateTime (optional)

#### Post

- `id`: String (ObjectId)
- `title`: String
- `description`: String
- `content`: String
- `codeSnippet`: String (optional)
- `createdAt`: DateTime
- `tags`: String[]
- `imageUrl`: String (optional)
- `fileId`: String (optional) - ImageKit file ID
- `likes`: Int
- `helpfulCount`: Int
- `authorId`: String (ObjectId) - Reference to User

#### Comment

- `id`: String (ObjectId)
- `content`: String
- `createdAt`: DateTime
- `avatarUrl`: String (optional)
- `imageUrl`: String (optional)
- `fileId`: String (optional)
- `postId`: String (ObjectId)
- `authorId`: String (ObjectId)
- `parentId`: String (ObjectId, optional) - For nested comments

#### Notification

- `id`: String (ObjectId)
- `userId`: String (ObjectId)
- `type`: String - 'like', 'helpful', 'comment', etc.
- `message`: String
- `isRead`: Boolean
- `postId`: String (optional)
- `commentId`: String (optional)
- `fromUserId`: String (ObjectId, optional)
- `createdAt`: DateTime

### Relationships

- User has many Posts, Comments, Likes, SavedPosts
- Post belongs to User, has many Comments, Likes, Helpfuls
- Comment belongs to User and Post, can have parent Comment (nested)
- Notification belongs to User

---

## 🔄 Reusing Components

### How to Reuse PostCard in Another Project

1. **Copy Component Files:**

   ```bash
   # Copy PostCard and its dependencies
   components/PostCard.tsx
   components/PostHeader.tsx
   components/PostContent.tsx
   components/PostStats.tsx
   components/PostActionsBar.tsx
   components/PostDropdownMenu.tsx
   ```

2. **Copy Required Hooks:**

   ```bash
   hooks/use-posts.ts
   hooks/use-auth.ts
   ```

3. **Copy UI Components:**

   ```bash
   components/ui/skeleton.tsx
   components/ui/toast.tsx
   components/ui/toaster.tsx
   hooks/use-toast.ts
   ```

4. **Install Dependencies:**

   ```bash
   npm install @tanstack/react-query react-icons
   ```

5. **Set Up React Query Provider:**

   ```tsx
   // In your root layout
   import { QueryProvider } from "@/components/providers/query-provider";

   export default function Layout({ children }) {
     return <QueryProvider>{children}</QueryProvider>;
   }
   ```

6. **Use the Component:**

   ```tsx
   import PostCard from "@/components/PostCard";
   import { usePosts } from "@/hooks/use-posts";

   function MyPage() {
     const { data: posts } = usePosts();

     return (
       <div>
         {posts?.map((post) => (
           <PostCard key={post.id} post={post} />
         ))}
       </div>
     );
   }
   ```

### How to Reuse CommentSection

1. **Copy Files:**

   ```bash
   components/CommentSection.tsx
   components/CommentItem.tsx
   components/CommentInput.tsx
   components/CommentHeader.tsx
   components/CommentAvatar.tsx
   components/CommentActionsBar.tsx
   hooks/use-comments.ts
   hooks/use-image-upload.ts
   ```

2. **Set Up API Endpoint:**

   Create `/api/comments/post/[postId]/route.ts` in your Next.js app.

3. **Use the Component:**

   ```tsx
   import CommentSection from "@/components/CommentSection";

   <CommentSection postId="post-id" />;
   ```

### How to Reuse Dialog Components

1. **Copy Files:**

   ```bash
   components/ConfirmDialog.tsx
   components/InputDialog.tsx
   components/ui/dialog.tsx
   components/ui/alert-dialog.tsx
   ```

2. **Install Dependencies:**

   ```bash
   npm install @radix-ui/react-dialog @radix-ui/react-alert-dialog
   ```

3. **Use Components:**

   ```tsx
   import { ConfirmDialog } from "@/components/ConfirmDialog";

   // Replace window.confirm
   <ConfirmDialog
     open={showConfirm}
     onOpenChange={setShowConfirm}
     title="Confirm Action"
     description="Are you sure?"
     onConfirm={handleConfirm}
   />;
   ```

---

## 🚢 Deployment

### Deploy to Vercel

1. **Push code to GitHub**

2. **Import project in Vercel:**

   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Add Environment Variables:**

   - Go to Project Settings → Environment Variables
   - Add all variables from `.env` file
   - Make sure `NEXT_PUBLIC_*` variables are added

4. **Configure Build Settings:**

   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

5. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy

### Environment Variables for Production

All environment variables from `.env` must be added to Vercel:

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `EMAIL_USER`
- `EMAIL_PASS`
- `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`
- `NEXT_PUBLIC_APP_URL` (your Vercel URL)

### Database Setup for Production

1. Use MongoDB Atlas (cloud database)
2. Whitelist Vercel IP ranges (or use 0.0.0.0/0 for all)
3. Update `DATABASE_URL` in Vercel environment variables

---

## 🏷 Keywords

**Technologies:** Next.js, React, TypeScript, MongoDB, Prisma, TanStack React Query, Tailwind CSS, ShadCN UI, ImageKit, JWT, bcrypt, Nodemailer

**Features:** Blog Platform, Developer Community, Code Sharing, Bug Tracking, Error Solutions, Nested Comments, Real-time Notifications, Image Upload, Authentication, Search & Filter

**Concepts:** Server-Side Rendering, Client-Side Rendering, Optimistic Updates, React Query, Caching, API Routes, Type Safety, Component Reusability, Responsive Design

---

## 📝 Conclusion

Dev-Bug-Coder-Blog is a comprehensive, production-ready blogging platform that demonstrates modern web development practices. It showcases:

- **Modern React Patterns:** Hooks, Context, Custom Hooks
- **State Management:** React Query for server state
- **Type Safety:** Full TypeScript implementation
- **Performance:** Optimistic updates, caching, code splitting
- **User Experience:** Skeleton loaders, toast notifications, smooth animations
- **Best Practices:** Reusable components, centralized hooks, proper error handling

This project serves as an excellent learning resource for:

- Next.js App Router
- React Query patterns
- TypeScript in React
- MongoDB with Prisma
- Authentication flows
- Image handling
- Real-time features

---

## Happy Coding! 🎉

Feel free to use this project repository and extend this project further!

If you have any questions or want to share your work, reach out via GitHub or my portfolio at [https://arnob-mahmud.vercel.app/](https://arnob-mahmud.vercel.app/).

**Enjoy building and learning!** 🚀

Thank you! 😊
