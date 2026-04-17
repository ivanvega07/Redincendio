import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { PersonalCargaPanel } from "@/components/planilla/PersonalCargaPanel";
import { getMesNombre } from "@/lib/utils";

export default async function PersonalPlanillaPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["PERSONAL", "ADMIN"].includes(session.user.rol)) redirect("/dashboard");

  const planilla = await prisma.planilla.findUnique({
    where: { id: params.id },
    include: {
      seccion: true,
      calificaciones: { include: { categoria: true } },
      historial: {
        include: { usuario: { select: { nombre: true, apellido: true } } },
        orderBy: { fecha: "asc" },
      },
      jefe: { select: { nombre: true, apellido: true } },
      jefatura: { select: { nombre: true, apellido: true } },
      personal: { select: { nombre: true, apellido: true } },
    },
  });

  if (!planilla) notFound();
  if (!["VISADA", "CARGADA"].includes(planilla.estado)) redirect("/personal/pendientes");

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
    <AppLayout title={`Planilla: ${planilla.seccion.nombre} — ${getMesNombre(planilla.mes)} ${planilla.anio}`}>
      <PersonalCargaPanel
        planilla={planilla as any}
        bomberos={bomberos}
        categorias={categorias}
      />
    </AppLayout>
  );
}
