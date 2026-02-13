import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/connection";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import { UserRole } from "@/types";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select(
          "+password",
        );
        if (!user || !user.password) {
          throw new Error("No user found with this email");
        }

        if (user.isSuspended) {
          throw new Error("Your account has been suspended");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isSuspended: user.isSuspended,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // BYPASS: Always allow sign in
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // BYPASS: Always return a fake admin user token
      return {
        id: "fake-admin-id-12345",
        name: "Admin User (Fake)",
        email: "admin@fake.com",
        role: UserRole.ADMIN,
        isSuspended: false,
        sub: "fake-admin-id-12345",
      };
    },
    async session({ session, token }) {
      // BYPASS: Always return a fake admin session
      return {
        user: {
          id: "fake-admin-id-12345",
          name: "Admin User (Fake)",
          email: "admin@fake.com",
          image: undefined,
          role: UserRole.ADMIN,
          isSuspended: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
