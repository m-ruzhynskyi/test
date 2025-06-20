import NextAuth from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
  }

  interface Session {
    user: User & {
      id: string;
      role: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const { auth, signIn, signOut } = NextAuth({
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === "ADMIN";
      const isAuthPage = nextUrl.pathname.startsWith("/login");
      const isAdminPage = 
        nextUrl.pathname.startsWith("/admin") || 
        nextUrl.pathname.startsWith("/api/admin");

      // Redirect unauthenticated users to login page
      if (!isLoggedIn && !isAuthPage) {
        return false;
      }

      // Redirect authenticated users from login page to home page
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Restrict admin pages to admin users
      if (isAdminPage && !isAdmin) {
        return false;
      }

      return true;
    },
  },
});

export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};

export const isAdmin = async () => {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
};