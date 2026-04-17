import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const seccionId = searchParams.get("seccionId");
  const rol = searchParams.get("rol");

  const where: any = {};
  if (seccionId) where.seccionId = seccionId;
  if (rol) where.rol = rol;

  const usuarios = await prisma.user.findMany({
    where,
    select: {
      id: true, username: true, nombre: true, apellido: true,
      dni: true, rol: true, activo: true, seccionId: true,
      seccion: { select: { id: true, nombre: true, numero: true } },
      createdAt: true,
    },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.errors }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        seccionId: rest.seccionId || null,
      },
      select: {
        id: true, username: true, nombre: true, apellido: true,
        dni: true, rol: true, activo: true, seccionId: true,
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Username o DNI ya existe" }, { status: 409 });
    }
    throw e;
  }
}
