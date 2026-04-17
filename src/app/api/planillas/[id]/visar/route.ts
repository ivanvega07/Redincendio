import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!["JEFATURA", "ADMIN"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const planilla = await prisma.planilla.findUnique({ where: { id: params.id } });
  if (!planilla) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  if (planilla.estado !== "ENVIADA") {
    return NextResponse.json({ error: "Solo se puede visar una planilla en estado Enviada" }, { status: 400 });
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "desconocida";

  const updated = await prisma.planilla.update({
    where: { id: params.id },
    data: {
      estado: "VISADA",
      visadaPorJefatura: true,
      fechaVisado: new Date(),
      jefaturaId: session.user.id,
    },
  });

  await prisma.historialPlanilla.create({
    data: {
      planillaId: params.id,
      accion: "VISADA",
      usuarioId: session.user.id,
      detalle: `Visada por ${session.user.nombre} ${session.user.apellido} desde IP ${ip}`,
    },
  });

  return NextResponse.json(updated);
}
