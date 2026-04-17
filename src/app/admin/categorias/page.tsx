import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminCategoriasPanel } from "@/components/admin/AdminCategoriasPanel";

export default async function AdminCategoriasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.rol !== "ADMIN") redirect("/dashboard");

  const categorias = await prisma.categoria.findMany({ orderBy: { orden: "asc" } });

  return (
    <AppLayout title="Categorías de Evaluación">
      <AdminCategoriasPanel categorias={categorias} />
    </AppLayout>
  );
}
