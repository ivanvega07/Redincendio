import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText } from "lucide-react";

export default async function AdminSeccionesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.rol !== "ADMIN") redirect("/dashboard");

  const secciones = await prisma.seccion.findMany({
    orderBy: { numero: "asc" },
    include: {
      _count: { select: { usuarios: true, planillas: true } },
    },
  });

  return (
    <AppLayout title="Secciones">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">{secciones.length} secciones configuradas</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {secciones.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                      Sección {s.numero}
                    </p>
                    <h3 className="text-base font-semibold text-gray-800 mt-0.5">{s.nombre}</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bombero-rojo/10">
                    <span className="text-bombero-rojo font-bold text-lg">{s.numero}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {s._count.usuarios} miembros
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {s._count.planillas} planillas
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
