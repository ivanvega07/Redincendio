import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revocarPlanillaSchema } from "@/lib/validations";
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
    return NextResponse.json({ error: "Solo se puede revocar una planilla en estado Enviada" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = revocarPlanillaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Motivo requerido (mínimo 10 caracteres)", details: parsed.error.errors }, { status: 400 });
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "desconocida";

  const updated = await prisma.planilla.update({
    where: { id: params.id },
    data: {
      estado: "REVOCADA",
      revocada: true,
      motivoRevocacion: parsed.data.motivo,
      fechaRevocacion: new Date(),
    },
  });

  await prisma.historialPlanilla.create({
    data: {
      planillaId: params.id,
      accion: "REVOCADA",
      usuarioId: session.user.id,
      detalle: `Revocada por ${session.user.nombre} ${session.user.apellido} desde IP ${ip}. Motivo: ${parsed.data.motivo}`,
    },
  });

  return NextResponse.json(updated);
}
