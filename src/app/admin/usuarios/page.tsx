import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminUsuariosPanel } from "@/components/admin/AdminUsuariosPanel";

export default async function AdminUsuariosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.rol !== "ADMIN") redirect("/dashboard");

  const [usuarios, secciones] = await Promise.all([
    prisma.user.findMany({
      include: { seccion: true },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    }),
    prisma.seccion.findMany({ orderBy: { numero: "asc" } }),
  ]);

  return (
    <AppLayout title="Gestión de Usuarios">
      <AdminUsuariosPanel usuarios={usuarios as any} secciones={secciones} />
    </AppLayout>
  );
}
