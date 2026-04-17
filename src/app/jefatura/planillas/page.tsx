import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoBadge } from "@/components/planilla/EstadoBadge";
import { Button } from "@/components/ui/button";
import { getMesNombre, formatFecha, MESES } from "@/lib/utils";
import { Eye } from "lucide-react";
import Link from "next/link";

export default async function JefaturaPlanillasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["JEFATURA", "ADMIN"].includes(session.user.rol)) redirect("/dashboard");

  const planillas = await prisma.planilla.findMany({
    include: {
      seccion: true,
      jefe: { select: { nombre: true, apellido: true } },
      jefatura: { select: { nombre: true, apellido: true } },
    },
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
  });

  return (
    <AppLayout title="Todas las Planillas">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">{planillas.length} planilla(s) en el sistema</p>

        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Sección</th>
                <th className="px-4 py-3 text-left font-medium">Período</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Jefe firmante</th>
                <th className="px-4 py-3 text-left font-medium">Última acción</th>
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
                    {p.jefe ? `${p.jefe.nombre} ${p.jefe.apellido}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatFecha(p.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/jefatura/planillas/${p.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-3 w-3" />
                        Ver
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
