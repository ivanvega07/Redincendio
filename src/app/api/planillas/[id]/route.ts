import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savePlanillaSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const planilla = await prisma.planilla.findUnique({
    where: { id: params.id },
    include: {
      seccion: true,
      calificaciones: { include: { categoria: true } },
      historial: {
        include: { usuario: { select: { nombre: true, apellido: true, rol: true } } },
        orderBy: { fecha: "asc" },
      },
      jefe: { select: { nombre: true, apellido: true } },
      jefatura: { select: { nombre: true, apellido: true } },
      personal: { select: { nombre: true, apellido: true } },
    },
  });

  if (!planilla) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  // Verificar acceso
  if (
    session.user.rol === "JEFE_SECCION" &&
    planilla.seccionId !== session.user.seccionId
  ) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  return NextResponse.json(planilla);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const planilla = await prisma.planilla.findUnique({ where: { id: params.id } });
  if (!planilla) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  if (!["BORRADOR", "REVOCADA"].includes(planilla.estado)) {
    return NextResponse.json({ error: "La planilla no puede editarse en su estado actual" }, { status: 400 });
  }

  if (
    session.user.rol === "JEFE_SECCION" &&
    planilla.seccionId !== session.user.seccionId
  ) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = savePlanillaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.errors }, { status: 400 });
  }

  // Actualizar calificaciones con upsert
  const ops = parsed.data.calificaciones.map((cal) =>
    prisma.calificacion.upsert({
      where: {
        planillaId_bomberoId_categoriaId: {
          planillaId: params.id,
          bomberoId: cal.bomberoId,
          categoriaId: cal.categoriaId,
        },
      },
      update: { puntaje: cal.puntaje, observacion: cal.observacion },
      create: {
        planillaId: params.id,
        bomberoId: cal.bomberoId,
        categoriaId: cal.categoriaId,
        puntaje: cal.puntaje,
        observacion: cal.observacion,
      },
    })
  );

  await prisma.$transaction(ops);

  const updated = await prisma.planilla.findUnique({
    where: { id: params.id },
    include: { calificaciones: { include: { categoria: true } }, seccion: true },
  });

  return NextResponse.json(updated);
}
