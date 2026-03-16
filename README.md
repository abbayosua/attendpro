# AttendPro

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</div>

<div align="center">
  <h3>Modern Employee Attendance Management System</h3>
  <p>A comprehensive, production-ready SaaS application for managing employee attendance, leave requests, and workforce analytics.</p>
</div>

---

## 🚀 Features

### Core Functionality
- **📍 GPS-Based Attendance** - Clock in/out with location verification and configurable radius
- **📷 Selfie Verification** - Optional photo capture for attendance validation
- **🏖️ Leave Management** - Submit, track, and approve leave requests
- **📊 Real-time Dashboard** - Comprehensive analytics and workforce insights
- **🏢 Multi-Organization Support** - SaaS-ready with organization isolation

### Authentication & Security
- **🔐 Supabase Auth** - Secure authentication with email/password
- **👥 Role-Based Access Control** - Admin, HR, Manager, Employee roles
- **🛡️ Protected Routes** - Middleware-based route protection
- **📝 Audit Logging** - Track all system activities

### User Experience
- **📱 Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- **🌙 Dark/Light Mode** - System-aware theme support
- **🗺️ Interactive Maps** - Leaflet-powered location visualization
- **🔔 Real-time Notifications** - Toast notifications for user feedback

---

## 🏗️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Database** | Supabase PostgreSQL |
| **ORM** | Prisma |
| **Authentication** | Supabase Auth |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **State Management** | Zustand |
| **Maps** | Leaflet + React-Leaflet |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |

---

## 📋 Prerequisites

- Node.js 18+ or Bun
- Supabase account
- PostgreSQL database (Supabase provides this)

---

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/abbayosua/attendpro.git
cd attendpro
```

### 2. Install dependencies

```bash
bun install
# or
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database Connection (Supabase PostgreSQL - Pooler for serverless)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Initialize the database

Run the SQL scripts in your Supabase SQL Editor:

1. First, run `supabase-setup.sql` to create tables and seed data
2. Then, run `supabase-auth-migration.sql` to add auth columns

### 5. Generate Prisma client

```bash
bun run db:generate
```

### 6. Create Supabase Auth users

Call the setup endpoint once:

```bash
curl -X POST http://localhost:3000/api/auth/setup-supabase-users \
  -H "Content-Type: application/json" \
  -d '{"secret": "setup-absenku-2025"}'
```

> ⚠️ **Important:** Delete the setup endpoint after creating users!

### 7. Start the development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Accounts

All accounts use the password: `demo123`

| Email | Role | Description |
|-------|------|-------------|
| `admin@absensi.com` | Admin | Full system access |
| `hr@absensi.com` | HR | User & leave management |
| `manager.engineering@absensi.com` | Manager | Team oversight |
| `manager.marketing@absensi.com` | Manager | Team oversight |
| `john.doe@absensi.com` | Employee | Engineering team |
| `jane.smith@absensi.com` | Employee | Engineering team |

---

## 📁 Project Structure

```
attendpro/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── attendance/   # Attendance CRUD
│   │   │   ├── departments/  # Department management
│   │   │   ├── employees/    # Employee management
│   │   │   ├── leave/        # Leave request handling
│   │   │   ├── reports/      # Reporting & exports
│   │   │   └── settings/     # Organization settings
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Main application page
│   ├── components/
│   │   ├── camera/           # Camera capture component
│   │   ├── dashboard/        # Dashboard UI components
│   │   ├── map/              # Leaflet map components
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/                # Custom React hooks
│   ├── lib/
│   │   ├── db.ts             # Prisma client
│   │   └── supabase/         # Supabase clients
│   ├── store/                # Zustand store
│   └── middleware.ts         # Auth middleware
├── supabase-auth-migration.sql
├── supabase-setup.sql
├── vercel.json
└── package.json
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel Dashboard
4. Deploy!

### Environment Variables for Production

Make sure to add these in your Vercel project settings:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 📱 Screenshots

### Login Page
Clean and modern login interface with Supabase Auth integration.

### Dashboard
Real-time overview of attendance, pending requests, and quick actions.

### Attendance
GPS-based clock in/out with map visualization and selfie verification.

### Leave Management
Submit and track leave requests with approval workflow.

### Reports
Comprehensive analytics with Excel export capability.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Abbayosua**
- Email: abbasiagian@gmail.com
- GitHub: [@abbayosua](https://github.com/abbayosua)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open Source Firebase Alternative
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI Components
- [Leaflet](https://leafletjs.com/) - Open-source JavaScript library for mobile-friendly interactive maps
- [Recharts](https://recharts.org/) - Redefined chart library built with React

---

<div align="center">
  <p>Made with ❤️ by Abbayosua</p>
  <p>⭐ Star this repo if you find it useful! ⭐</p>
</div>
