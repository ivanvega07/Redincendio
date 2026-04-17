import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const secciones = await prisma.seccion.findMany({
    orderBy: { numero: "asc" },
    include: {
      _count: { select: { usuarios: true, planillas: true } },
    },
  });

  return NextResponse.json(secciones);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.nombre || !body.numero) {
    return NextResponse.json({ error: "Nombre y número son requeridos" }, { status: 400 });
  }

  try {
    const seccion = await prisma.seccion.create({
      data: { nombre: body.nombre, numero: parseInt(body.numero) },
    });
    return NextResponse.json(seccion, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una sección con ese número" }, { status: 409 });
    }
    throw e;
  }
}
