import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPlanillaSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const seccionId = searchParams.get("seccionId");
  const mes = searchParams.get("mes");
  const anio = searchParams.get("anio");
  const estado = searchParams.get("estado");

  const where: any = {};
  if (seccionId) where.seccionId = seccionId;
  if (mes) where.mes = parseInt(mes);
  if (anio) where.anio = parseInt(anio);
  if (estado) where.estado = estado;

  // JEFE_SECCION solo ve su sección
  if (session.user.rol === "JEFE_SECCION" && session.user.seccionId) {
    where.seccionId = session.user.seccionId;
  }

  const planillas = await prisma.planilla.findMany({
    where,
    include: { seccion: true },
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
  });

  return NextResponse.json(planillas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!["JEFE_SECCION", "ADMIN"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createPlanillaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.errors }, { status: 400 });
  }

  const { seccionId, mes, anio } = parsed.data;

  // Verificar que el Jefe solo cree para su sección
  if (session.user.rol === "JEFE_SECCION" && session.user.seccionId !== seccionId) {
    return NextResponse.json({ error: "No puede crear planilla para otra sección" }, { status: 403 });
  }

  // Verificar si ya existe
  const existing = await prisma.planilla.findUnique({
    where: { seccionId_mes_anio: { seccionId, mes, anio } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una planilla para esa sección, mes y año" }, { status: 409 });
  }

  const planilla = await prisma.planilla.create({
    data: { seccionId, mes, anio, estado: "BORRADOR" },
    include: { seccion: true },
  });

  // Registrar en historial
  await prisma.historialPlanilla.create({
    data: {
      planillaId: planilla.id,
      accion: "CREADA",
      usuarioId: session.user.id,
      detalle: `Planilla creada por ${session.user.nombre} ${session.user.apellido}`,
    },
  });

  return NextResponse.json(planilla, { status: 201 });
}
