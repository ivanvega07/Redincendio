import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!["PERSONAL", "ADMIN"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const planilla = await prisma.planilla.findUnique({ where: { id: params.id } });
  if (!planilla) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  if (planilla.estado !== "VISADA") {
    return NextResponse.json({ error: "Solo se pueden cargar planillas en estado Visada" }, { status: 400 });
  }

  const updated = await prisma.planilla.update({
    where: { id: params.id },
    data: {
      estado: "CARGADA",
      cargadaEnSistema: true,
      fechaCarga: new Date(),
      personalId: session.user.id,
    },
  });

  await prisma.historialPlanilla.create({
    data: {
      planillaId: params.id,
      accion: "CARGADA",
      usuarioId: session.user.id,
      detalle: `Marcada como cargada en sistema por ${session.user.nombre} ${session.user.apellido}`,
    },
  });

  return NextResponse.json(updated);
}
