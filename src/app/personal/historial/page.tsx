import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoBadge } from "@/components/planilla/EstadoBadge";
import { Button } from "@/components/ui/button";
import { getMesNombre, formatFecha } from "@/lib/utils";
import { Eye, History } from "lucide-react";
import Link from "next/link";

export default async function PersonalHistorialPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["PERSONAL", "ADMIN"].includes(session.user.rol)) redirect("/dashboard");

  const planillas = await prisma.planilla.findMany({
    where: { estado: "CARGADA" },
    include: {
      seccion: true,
      jefatura: { select: { nombre: true, apellido: true } },
      personal: { select: { nombre: true, apellido: true } },
    },
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
  });

  return (
    <AppLayout title="Historial de Planillas Cargadas">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-bombero-rojo" />
          <p className="text-sm text-gray-500">{planillas.length} planilla(s) procesada(s)</p>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Sección</th>
                <th className="px-4 py-3 text-left font-medium">Período</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Cargada por</th>
                <th className="px-4 py-3 text-left font-medium">Fecha carga</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {planillas.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.seccion.nombre}</td>
                  <td className="px-4 py-3">{getMesNombre(p.mes)} {p.anio}</td>
                  <td className="px-4 py-3"><EstadoBadge estado={p.estado} /></td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.personal ? `${p.personal.nombre} ${p.personal.apellido}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatFecha(p.fechaCarga ?? p.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/personal/planillas/${p.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-3 w-3" />Ver
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
