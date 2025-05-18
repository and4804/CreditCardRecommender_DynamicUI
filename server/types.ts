import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    auth0Id?: string;
    user?: {
      id: number;
      username: string;
    };
  }
} 