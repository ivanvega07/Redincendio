import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoBadge } from "@/components/planilla/EstadoBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMesNombre, formatFecha } from "@/lib/utils";
import { Plus, Eye, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function PlanillasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["JEFE_SECCION", "ADMIN"].includes(session.user.rol)) redirect("/dashboard");

  const seccionId = session.user.seccionId;
  if (!seccionId) {
    return (
      <AppLayout title="Mis Planillas">
        <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">Su usuario no tiene una sección asignada. Contacte al administrador.</p>
        </div>
      </AppLayout>
    );
  }

  const planillas = await prisma.planilla.findMany({
    where: { seccionId },
    include: { seccion: true },
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
  });

  const seccion = await prisma.seccion.findUnique({ where: { id: seccionId } });

  return (
    <AppLayout title="Mis Planillas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{seccion?.nombre}</h2>
            <p className="text-sm text-gray-500">{planillas.length} planilla(s) registradas</p>
          </div>
          <Link href="/planillas/nueva">
            <Button className="bg-bombero-rojo hover:bg-bombero-rojo-oscuro">
              <Plus className="mr-2 h-4 w-4" />
              Nueva planilla
            </Button>
          </Link>
        </div>

        {planillas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-500">No hay planillas creadas aún.</p>
              <Link href="/planillas/nueva" className="mt-4">
                <Button className="bg-bombero-rojo hover:bg-bombero-rojo-oscuro">
                  Crear primera planilla
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Período</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Última actualización</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {planillas.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {getMesNombre(p.mes)} {p.anio}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={p.estado} />
                      {p.estado === "REVOCADA" && (
                        <span className="ml-2 text-xs text-red-600 font-medium">⚠ Requiere corrección</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatFecha(p.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/planillas/${p.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-3 w-3" />
                          {["BORRADOR", "REVOCADA"].includes(p.estado) ? "Editar" : "Ver"}
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
