# Eragon - AI Sales Intelligence

A modern React application for AI-powered sales intelligence and automation.

## Features

- **Custom Authentication**: Sign in with email/password or Google OAuth
- **AI-Powered Assistants**: Specialized AI agents for different sales tasks
- **Session Management**: Track and manage AI assistant sessions
- **Modern UI**: Built with React, Tailwind CSS, and Radix UI components

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Authentication**: Custom auth with Google OAuth support
- **Storage**: Local storage for development

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Development

The application runs on `http://localhost:5173` by default.

### Authentication

The app includes a custom authentication system with:
- Email/password sign in and sign up
- Google OAuth integration
- Protected routes
- Persistent sessions

### Mock API

For development, the app uses a mock API that stores data in localStorage. This can be easily replaced with a real backend API.

## Project Structure

```
src/
├── components/         # Reusable UI components
├── contexts/          # React contexts (auth, etc.)
├── pages/             # Application pages
├── api/               # API layer and mock services
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
└── utils/             # Helper functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License