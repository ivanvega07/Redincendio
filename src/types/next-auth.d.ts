import { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      nombre: string;
      apellido: string;
      email?: string | null;
      rol: Role;
      seccionId?: string;
      seccionNombre?: string;
    };
  }

  interface User {
    id: string;
    username: string;
    nombre: string;
    apellido: string;
    rol: Role;
    seccionId?: string;
    seccionNombre?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    nombre: string;
    apellido: string;
    rol: Role;
    seccionId?: string;
    seccionNombre?: string;
  }
}
