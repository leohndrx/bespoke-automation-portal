# Bespoke Automation Portal

A Next.js 14 project management and task automation portal built with Supabase.

## Features

- Authentication with email/password
- Project management (create, view, edit projects)
- Task management with statuses (todo, in progress, done)
- Tasks can be standalone or linked to projects
- Dashboard with overview statistics
- Responsive design with Tailwind CSS

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (Authentication, Database)
- TailwindCSS
- React Hook Form
- Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Setup

1. Clone the repository

```bash
git clone <repository-url>
cd bespoke-automation-portal
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

Create a `.env.local` file in the root of the project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

Replace the placeholder values with your Supabase project credentials.

4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Schema

The application uses two main tables in Supabase:

### Projects Table

- `id` (uuid, primary key)
- `name` (text, not null)
- `description` (text)
- `owner_id` (uuid, foreign key to auth.users)
- `created_at` (timestamp with time zone)

### Tasks Table

- `id` (uuid, primary key)
- `project_id` (uuid, foreign key to projects, nullable)
- `title` (text, not null)
- `description` (text)
- `status` (text enum: todo, in_progress, done)
- `owner_id` (uuid, foreign key to auth.users)
- `due_date` (date, nullable)
- `created_at` (timestamp with time zone)

## License

This project is licensed under the MIT License.
