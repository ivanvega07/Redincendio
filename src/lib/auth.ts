import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { seccion: true },
        });

        if (!user || !user.activo) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!passwordMatch) return null;

        return {
          id: user.id,
          username: user.username,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol,
          seccionId: user.seccionId ?? undefined,
          seccionNombre: user.seccion?.nombre ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.nombre = (user as any).nombre;
        token.apellido = (user as any).apellido;
        token.rol = (user as any).rol;
        token.seccionId = (user as any).seccionId;
        token.seccionNombre = (user as any).seccionNombre;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.nombre = token.nombre as string;
        session.user.apellido = token.apellido as string;
        session.user.rol = token.rol as Role;
        session.user.seccionId = token.seccionId as string | undefined;
        session.user.seccionNombre = token.seccionNombre as string | undefined;
      }
      return session;
    },
  },
};
