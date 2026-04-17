import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { PlanillaEditor } from "@/components/planilla/PlanillaEditor";
import { getMesNombre } from "@/lib/utils";

export default async function PlanillaPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

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

  // Verificar acceso
  if (
    session.user.rol === "JEFE_SECCION" &&
    planilla.seccionId !== session.user.seccionId
  ) {
    redirect("/dashboard");
  }

  // Obtener bomberos de la sección
  const bomberos = await prisma.user.findMany({
    where: { seccionId: planilla.seccionId, activo: true },
    select: { id: true, nombre: true, apellido: true, dni: true },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });

  // Obtener categorías activas
  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
  });

  const canEdit =
    ["BORRADOR", "REVOCADA"].includes(planilla.estado) &&
    (session.user.rol === "JEFE_SECCION" || session.user.rol === "ADMIN");

  return (
    <AppLayout
      title={`Planilla ${getMesNombre(planilla.mes)} ${planilla.anio} — ${planilla.seccion.nombre}`}
    >
      <PlanillaEditor
        planilla={planilla as any}
        bomberos={bomberos}
        categorias={categorias}
        canEdit={canEdit}
        userRol={session.user.rol}
        userId={session.user.id}
      />
    </AppLayout>
  );
}
