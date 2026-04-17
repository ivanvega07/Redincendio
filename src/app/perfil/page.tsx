import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { PerfilPanel } from "@/components/PerfilPanel";
import { ROL_LABELS } from "@/lib/utils";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { seccion: true },
  });

  if (!user) redirect("/login");

  return (
    <AppLayout title="Mi Perfil">
      <PerfilPanel
        user={{
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          username: user.username,
          dni: user.dni,
          rol: user.rol,
          seccionNombre: user.seccion?.nombre ?? null,
          rolLabel: ROL_LABELS[user.rol],
        }}
      />
    </AppLayout>
  );
}
