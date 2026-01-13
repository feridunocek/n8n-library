import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/'); // Protect everything by default? 
            // User asked for "Personal Login Area".
            // Let's protect /workflows and /dashboard, allow public landing if exists, but currently "/" is dashboard.
            // So protect everything except login/static assets.

            const isLoginPage = nextUrl.pathname.startsWith('/login');

            if (isOnDashboard && !isLoginPage) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && isLoginPage) {
                return Response.redirect(new URL('/', nextUrl)); // Redirect logged-in users away from login
            }
            return true;
        },
        // Add user ID to session
        session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        }
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
