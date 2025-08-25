# Project Assignment Tracker

A comprehensive assignment management system powered by AI, built with Next.js 14, Supabase, and OpenAI. This application helps students and educators create, manage, and track academic assignments with intelligent planning and AI-powered assistance.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-green)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange)](https://openai.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue)](https://tailwindcss.com/)

## ✨ Features

### 🎯 Core Functionality
- **Assignment Management** - Create, edit, and track assignments with due dates and priorities
- **Class Organization** - Organize assignments by classes with color coding and filtering
- **AI-Powered Planning** - Generate detailed assignment plans using OpenAI GPT-4
- **Smart Subtasks** - Break down assignments into manageable, actionable subtasks
- **Progress Tracking** - Visual progress indicators and completion tracking

### 🤖 AI Integration
- **Intelligent Plan Generation** - AI creates customized assignment plans based on requirements
- **Plan Refinement Chat** - Interactive chat to refine and improve generated plans
- **Contextual Suggestions** - Smart recommendations for assignment structure and timeline
- **Syllabus Parsing** - Upload and extract assignments from syllabus documents

### 📊 Advanced Features
- **Dashboard Analytics** - Overview of assignments, deadlines, and progress
- **Urgency Indicators** - Smart prioritization based on due dates and complexity
- **File Upload Support** - Attach documents and resources to assignments
- **Responsive Design** - Fully responsive interface for desktop and mobile
- **Dark/Light Mode** - Theme switching for comfortable viewing

### 🔒 Security & Monitoring
- **Authentication** - Secure user authentication with Supabase Auth
- **Real-time Updates** - Live synchronization across devices
- **Error Tracking** - Comprehensive error monitoring with Sentry
- **Performance Monitoring** - Application performance and health tracking
- **Admin Dashboard** - System monitoring and health checks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account and project
- OpenAI API key
- Git installed

### 1. Clone & Install
```bash
git clone https://github.com/your-username/project-assignment-tracker.git
cd project-assignment-tracker
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup
Run the provided SQL migrations in your Supabase SQL editor:
```bash
# Copy the contents of these files to Supabase SQL editor:
database-migration-complete.sql
database-migration-planning-tables.sql
database-migration-refinement-messages.sql
```

### 4. Start Development
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📱 Screenshots

### Dashboard Overview
![Dashboard](docs/images/dashboard.png)

### AI Plan Generation
![AI Planning](docs/images/ai-planning.png)

### Assignment Detail View
![Assignment Detail](docs/images/assignment-detail.png)

## 🏗️ Architecture

```
┌─ Frontend (Next.js 14) ────┐
│  ├─ App Router             │
│  ├─ TypeScript             │
│  ├─ Tailwind CSS           │
│  └─ React Components       │
├─ API Layer (tRPC) ─────────┤
│  ├─ Type-safe APIs         │
│  ├─ Server-side Logic      │
│  └─ Authentication         │
├─ Database (Supabase) ──────┤
│  ├─ PostgreSQL             │
│  ├─ Real-time Updates      │
│  ├─ Row Level Security     │
│  └─ File Storage           │
├─ AI Integration ───────────┤
│  ├─ OpenAI GPT-4          │
│  ├─ Plan Generation        │
│  ├─ Chat Refinement        │
│  └─ Contextual AI          │
└─ Monitoring & Deploy ──────┤
   ├─ Sentry (Errors)        │
   ├─ Health Checks          │
   ├─ Performance Monitor    │
   └─ Multi-platform Deploy  │
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management
- **Zustand** - State management

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Primary database
- **tRPC** - End-to-end type-safe APIs
- **Zod** - Schema validation

### AI & Integration
- **OpenAI GPT-4** - AI plan generation
- **React Query** - Data fetching and caching

### Development & Deployment
- **ESLint & Prettier** - Code quality
- **Jest & Playwright** - Testing framework
- **Docker** - Containerization
- **Vercel** - Primary deployment platform
- **Sentry** - Error tracking

## 📖 Documentation

- [**Deployment Guide**](DEPLOYMENT.md) - Comprehensive deployment instructions
- [**API Documentation**](docs/api/README.md) - tRPC API endpoints and schemas
- [**Development Guide**](docs/DEVELOPMENT.md) - Local development setup
- [**Contributing Guidelines**](docs/CONTRIBUTING.md) - How to contribute
- [**Architecture Overview**](docs/ARCHITECTURE.md) - System design and patterns

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm run deploy:vercel
```

### Docker
```bash
npm run docker:build
npm run docker:run
```

### Other Platforms
- Railway: Connect repository and deploy
- Render: Use `render.yaml` configuration
- Manual: See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions

## 📊 Monitoring

### Health Checks
- **Basic Health**: `/api/health`
- **Detailed Health**: `/api/health/detailed`
- **Admin Dashboard**: `/admin/monitoring`

### Error Tracking
- Sentry integration for error monitoring
- Performance tracking and alerts
- User session replay for debugging

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Process
1. **Issues First** - Create or claim an issue before starting work
2. **Branch Naming** - Use descriptive branch names (feature/, fix/, docs/)
3. **Testing** - Add tests for new functionality
4. **Documentation** - Update docs for user-facing changes
5. **Code Review** - All PRs require review and approval

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js Team](https://nextjs.org/) for the amazing framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [OpenAI](https://openai.com/) for AI capabilities
- [Vercel](https://vercel.com/) for deployment platform
- All contributors and beta testers

## 📞 Support

- **Documentation**: Check our comprehensive docs
- **Issues**: [GitHub Issues](https://github.com/your-username/project-assignment-tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/project-assignment-tracker/discussions)
- **Health Check**: Visit `/api/health` for system status

---

**Built with ❤️ using Next.js, Supabase, and OpenAI**

[⬆ Back to top](#project-assignment-tracker)