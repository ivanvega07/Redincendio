import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoBadge } from "@/components/planilla/EstadoBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMesNombre, formatFecha } from "@/lib/utils";
import { Eye, Package } from "lucide-react";
import Link from "next/link";

export default async function PersonalPendientesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["PERSONAL", "ADMIN"].includes(session.user.rol)) redirect("/dashboard");

  const planillas = await prisma.planilla.findMany({
    where: { estado: "VISADA" },
    include: {
      seccion: true,
      jefe: { select: { nombre: true, apellido: true } },
      jefatura: { select: { nombre: true, apellido: true } },
    },
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
  });

  return (
    <AppLayout title="Pendientes de Carga">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-bombero-rojo" />
          <div>
            <h2 className="font-semibold text-gray-800">Planillas visadas listas para cargar</h2>
            <p className="text-sm text-gray-500">{planillas.length} planilla(s) pendiente(s)</p>
          </div>
        </div>

        {planillas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">No hay planillas pendientes de carga.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Sección</th>
                  <th className="px-4 py-3 text-left font-medium">Período</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Visado por</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha visado</th>
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
                      {p.jefatura ? `${p.jefatura.nombre} ${p.jefatura.apellido}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatFecha(p.fechaVisado ?? p.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/personal/planillas/${p.id}`}>
                        <Button variant="outline" size="sm" className="border-bombero-rojo text-bombero-rojo hover:bg-bombero-rojo hover:text-white">
                          <Eye className="mr-1 h-3 w-3" />
                          Procesar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
