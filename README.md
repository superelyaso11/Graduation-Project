# University Lost & Found Platform Graduation Porject

A full-stack web application where students, campus security, and admins can report, discover, and claim lost and found items on campus.

## Features

- Role-based access (Student, Security, Admin)
- Report lost and found items with image upload
- Automatic matching engine based on category, location, and date
- Claim verification workflow before contact details are revealed
- Real-time notifications via WebSockets
- AI-assisted item categorization using Gemini API
- Campus Security dashboard for physical handovers
- Admin dashboard for moderation and donation management
- Expiry logic — unclaimed items flagged for donation after set period

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Authentication | JWT + bcrypt |
| Real-time | Socket.io |
| File Uploads | Multer + Cloudinary |
| AI Categorization | Gemini API |
| CI/CD | GitHub Actions |
| Report | LaTeX |

## ER Diagram
```mermaid
erDiagram
    User {
        int id PK
        string name
        string email
        string password
        enum role
        int points
        datetime createdAt
    }

    LostItem {
        int id PK
        string title
        string description
        enum category
        string location
        datetime dateLost
        string imageUrl
        enum status
        datetime createdAt
        int userId FK
    }

    FoundItem {
        int id PK
        string title
        string description
        enum category
        string location
        datetime dateFound
        string imageUrl
        enum status
        string heldAt
        datetime createdAt
        int userId FK
    }

    Match {
        int id PK
        float score
        enum status
        datetime createdAt
        int lostItemId FK
        int foundItemId FK
    }

    Claim {
        int id PK
        string question
        string answer
        boolean isCorrect
        enum status
        datetime createdAt
        int claimantId FK
        int lostItemId FK
        int foundItemId FK
    }

    Notification {
        int id PK
        string message
        boolean isRead
        datetime createdAt
        int userId FK
    }

    User ||--o{ LostItem : "reports"
    User ||--o{ FoundItem : "reports"
    User ||--o{ Claim : "submits"
    User ||--o{ Notification : "receives"
    LostItem ||--o{ Match : "involved in"
    FoundItem ||--o{ Match : "involved in"
    LostItem ||--o{ Claim : "claimed via"
    FoundItem ||--o{ Claim : "claimed via"
```

## Project Setup

### Prerequisites
- Node.js v18+
- PostgreSQL
- Cloudinary account
- Gemini API key

### Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Copy `backend/.env.example` to `backend/.env` and fill in your values:
```
DATABASE_URL=postgresql://user:password@localhost:5432/lostandfound
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_key
PORT=5000
```

## CI/CD
Every push triggers the GitHub Actions pipeline which runs ESLint on both frontend and backend automatically.

## Project Management
All tasks are tracked on the [GitHub Projects Kanban board](../../projects).
