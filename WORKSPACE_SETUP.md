# Better Chatbot - Workspace Setup Guide

## 🎉 Workspace Status

✅ **Repository Cloned** - 763 files from https://github.com/cgoinglove/better-chatbot  
✅ **Dependencies Installed** - 1190 packages installed  
✅ **Environment Configured** - .env file created  
✅ **VS Code Tasks** - Development tasks configured  

## 📋 Before You Start

### Required
1. **PostgreSQL Database** - See options below
2. **At least one LLM API Key** - OpenAI, Anthropic, Google, etc.

### Optional
- **EXA API Key** - For web search features
- **Redis** - For multi-instance support
- **OAuth Credentials** - For Google/GitHub/Microsoft login

## 🗄️ Database Setup

### Option 1: Cloud Database (Recommended - No Installation)

#### Neon (Free Tier)
1. Go to https://neon.tech
2. Sign up and create a new project
3. Copy the connection string
4. Update `.env`: `POSTGRES_URL=your-neon-connection-string`

#### Vercel Postgres
1. Go to https://vercel.com/storage/postgres
2. Create a new database
3. Copy the connection string
4. Update `.env`: `POSTGRES_URL=your-vercel-connection-string`

### Option 2: Local PostgreSQL

```bash
# Install PostgreSQL via Homebrew
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Create database
createdb better_chatbot

# Connection string is already in .env:
# POSTGRES_URL=postgres://postgres:postgres@localhost:5432/better_chatbot
```

## 🔑 API Keys Setup

Edit `.env` and add at least one provider:

```bash
# Required: At least one LLM provider
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
XAI_API_KEY=...

# Optional: For web search and research
EXA_API_KEY=...
```

### Get API Keys:
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **Google AI**: https://aistudio.google.com/app/apikey
- **xAI**: https://console.x.ai/
- **Exa**: https://dashboard.exa.ai/

## 🚀 Running the Application

### 1. Run Database Migrations

```bash
npm run db:migrate
```

Or use VS Code task: **Terminal → Run Task → db: Run Migrations**

### 2. Start Development Server

```bash
npm run dev
```

Or use VS Code task: **Terminal → Run Build Task → dev: Start Development Server**

The app will be available at **http://localhost:3000**

## 📦 Available Scripts

```bash
npm run dev              # Start development server
npm run dev:turbopack    # Start with Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run test             # Run tests
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Biome
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Drizzle Studio (database GUI)
npm run db:generate      # Generate migrations
npm run db:push          # Push schema to database
```

## 🧩 VS Code Tasks

Access via **Terminal → Run Task**:
- **dev: Start Development Server** - Starts Next.js dev server
- **db: Run Migrations** - Applies database migrations
- **db: Open Studio** - Opens Drizzle Studio for database management

## 🎯 Features Available

Once running, you'll have access to:

- ✨ **Multi-LLM Support** - OpenAI, Anthropic, Google, xAI, Ollama, and more
- 🔧 **MCP Protocol** - Model Context Protocol server integration
- 🌐 **Web Search** - Internet search capabilities (requires EXA_API_KEY)
- 💻 **Code Execution** - JavaScript and Python code execution
- 📊 **Data Visualization** - Charts and tables
- 🖼️ **Image Generation** - AI-powered image creation
- 🤖 **Custom Agents** - Create specialized AI assistants
- 🎙️ **Voice Assistant** - Real-time voice chat
- 🔀 **Visual Workflows** - Build custom automation workflows
- 👥 **Collaboration** - Share agents, workflows, and configurations

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is busy:
```bash
lsof -ti:3000 | xargs kill -9  # Kill process using port 3000
npm run dev                     # Try again
```

### Database Connection Issues
1. Verify POSTGRES_URL in .env is correct
2. Ensure PostgreSQL is running (if local)
3. Test connection: `psql $POSTGRES_URL`

### Missing API Keys Error
Add at least one LLM provider API key to `.env`

### Corepack/PNPM Issues
This workspace uses npm instead of pnpm due to Node v20.18.0 compatibility. All scripts work with npm.

## 📚 Learn More

- [Project README](./README.md)
- [MCP Setup Guide](./docs/tips-guides/mcp-server-setup-and-tool-testing.md)
- [Docker Guide](./docs/tips-guides/docker.md)
- [Vercel Deployment](./docs/tips-guides/vercel.md)
- [Live Demo](https://better-chatbot-demo.vercel.app/)

## 🆘 Need Help?

- Discord: https://discord.gg/gCRu69Upnp
- GitHub Issues: https://github.com/cgoinglove/better-chatbot/issues
- MCP Documentation: https://modelcontextprotocol.io/introduction

---

**Ready to go?** Set up your database → Add API keys → Run `npm run db:migrate` → Run `npm run dev` 🚀
