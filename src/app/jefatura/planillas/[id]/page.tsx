import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { JefaturaRevisionPanel } from "@/components/planilla/JefaturaRevisionPanel";
import { getMesNombre } from "@/lib/utils";

export default async function JefaturaPlanillaPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["JEFATURA", "ADMIN"].includes(session.user.rol)) redirect("/dashboard");

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

  if (!planilla) notFound();

  const bomberos = await prisma.user.findMany({
    where: { seccionId: planilla.seccionId, activo: true },
    select: { id: true, nombre: true, apellido: true, dni: true },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });

  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
  });

  return (
    <AppLayout title={`Revisión: ${planilla.seccion.nombre} — ${getMesNombre(planilla.mes)} ${planilla.anio}`}>
      <JefaturaRevisionPanel
        planilla={planilla as any}
        bomberos={bomberos}
        categorias={categorias}
        userRol={session.user.rol}
      />
    </AppLayout>
  );
}
