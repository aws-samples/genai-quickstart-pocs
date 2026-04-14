# Frontend-Two React Package

React-based frontend package for  real-time translation interface.

## Features

- React 19 with TypeScript
- Vite for fast development and builds
- Tailwind CSS with AWS design system colors
- WebSocket-based real-time communication
- Audio capture and playback
- Property-based testing with fast-check

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` to set your WebSocket URL:

```
VITE_WS_URL=ws://localhost:8082
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5174`

### Building

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

### Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Linting

Run ESLint:

```bash
npm run lint
```

## Project Structure

```
packages/frontend-two/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── styles/         # Global styles
│   ├── App.tsx         # Root component
│   └── main.tsx        # Application entry point
├── index.html          # HTML template
└── Configuration files
```

## Requirements

See `.kiro/specs/frontend-two-react-package/requirements.md` for detailed requirements.

## Design

See `.kiro/specs/frontend-two-react-package/design.md` for architecture and design details.
