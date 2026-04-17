import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!["JEFE_SECCION", "ADMIN"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const planilla = await prisma.planilla.findUnique({
    where: { id: params.id },
    include: { calificaciones: true, seccion: true },
  });

  if (!planilla) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  if (!["BORRADOR", "REVOCADA"].includes(planilla.estado)) {
    return NextResponse.json({ error: "Solo se puede firmar una planilla en estado Borrador o Revocada" }, { status: 400 });
  }

  if (
    session.user.rol === "JEFE_SECCION" &&
    planilla.seccionId !== session.user.seccionId
  ) {
    return NextResponse.json({ error: "Sin permisos para firmar esta planilla" }, { status: 403 });
  }

  // Validar que tenga calificaciones
  if (planilla.calificaciones.length === 0) {
    return NextResponse.json({ error: "La planilla no tiene calificaciones cargadas" }, { status: 400 });
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "desconocida";

  const updated = await prisma.planilla.update({
    where: { id: params.id },
    data: {
      estado: "ENVIADA",
      firmadaPorJefe: true,
      fechaFirmaJefe: new Date(),
      jefeId: session.user.id,
      revocada: false,
    },
  });

  await prisma.historialPlanilla.create({
    data: {
      planillaId: params.id,
      accion: "FIRMADA_ENVIADA",
      usuarioId: session.user.id,
      detalle: `Firmada y enviada a Jefatura por ${session.user.nombre} ${session.user.apellido} desde IP ${ip}`,
    },
  });

  return NextResponse.json(updated);
}
