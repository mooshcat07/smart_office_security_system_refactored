import { createAuthClient } from "better-auth/react";

// local
// export const authClient = createAuthClient({
//   baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
// });

// vercel
export const authClient = createAuthClient();
