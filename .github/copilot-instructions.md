# Better Chatbot Workspace Setup

## Project Information
- **Project Type:** Next.js Application
- **Repository:** https://github.com/cgoinglove/better-chatbot
- **Purpose:** Advanced AI chatbot with MCP support, multiple LLM providers, voice assistant, and visual workflows
- **Stack:** Next.js 16, React 19, TypeScript, PostgreSQL, Better Auth, AI SDK
- **Package Manager:** npm (pnpm configured but using npm for compatibility)

## Setup Checklist

### 1. Requirements ✅
- [x] Clarify project type and requirements
- Next.js chatbot with MCP protocol support
- Multiple AI providers (OpenAI, Anthropic, Google, xAI, etc.)
- Voice assistant capabilities
- PostgreSQL database required

### 2. Scaffold ✅
- [x] Clone project structure from GitHub
- Repository cloned to /Users/theprojectxco./better-chatbot
- 763 files transferred successfully

### 3. Customize ✅
- [x] Configure environment variables
- Created .env file with:
  - BETTER_AUTH_SECRET (generated)
  - BETTER_AUTH_URL=http://localhost:3000
  - POSTGRES_URL=postgres://postgres:postgres@localhost:5432/better_chatbot
  - OPENAI_API_KEY placeholder

### 4. Extensions
- [ ] Install recommended VS Code extensions

### 5. Compile ✅
- [x] Install dependencies with npm (1190 packages)
- Note: Installed with --ignore-scripts due to corepack issue in Node v20.18.0
- 4 moderate vulnerabilities (can be addressed later)

### 6. Task
- [ ] Create VS Code task for development server

### 7. Launch ⚠️
- [ ] Set up PostgreSQL database
- [ ] Run database migrations
- [ ] Start development server

### 8. Documentation
- [ ] Review README.md for additional setup steps

## Setup Notes

### Database Setup Required
This project requires PostgreSQL. Options:
1. **Cloud Database (Recommended for quick start):**
   - Neon: https://neon.tech (Free tier available)
   - Vercel Postgres: https://vercel.com/storage/postgres
   - Update POSTGRES_URL in .env with connection string

2. **Local PostgreSQL:**
   - Install via Homebrew: `brew install postgresql@16`
   - Start service: `brew services start postgresql@16`
   - Create database: `createdb better_chatbot`

### API Keys
- At least one LLM provider API key required (OpenAI, Anthropic, Google, etc.)
- Optional: EXA_API_KEY for web search features
- Update .env file with your keys

### Next Steps
1. Set up PostgreSQL database
2. Update .env with valid POSTGRES_URL
3. Add at least one LLM provider API key to .env
4. Run database migrations: `npm run db:migrate`
5. Start development server: `npm run dev`
