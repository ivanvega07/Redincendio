import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "@/components/planilla/EstadoBadge";
import { getMesNombre, formatFecha } from "@/lib/utils";
import {
  FileText, ClipboardCheck, CheckCircle2, AlertCircle,
  Clock, Package, TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id: userId, rol, seccionId } = session.user;

  let stats: { label: string; value: number; icon: React.ElementType; color: string; href: string }[] = [];
  let planillasRecientes: any[] = [];

  if (rol === "JEFE_SECCION" && seccionId) {
    const [borrador, enviadas, revocadas, recientes] = await Promise.all([
      prisma.planilla.count({ where: { seccionId, estado: "BORRADOR" } }),
      prisma.planilla.count({ where: { seccionId, estado: "ENVIADA" } }),
      prisma.planilla.count({ where: { seccionId, estado: "REVOCADA" } }),
      prisma.planilla.findMany({
        where: { seccionId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { seccion: true },
      }),
    ]);
    stats = [
      { label: "Borradores", value: borrador, icon: FileText, color: "text-gray-600", href: "/planillas" },
      { label: "Enviadas", value: enviadas, icon: Clock, color: "text-yellow-600", href: "/planillas" },
      { label: "Revocadas", value: revocadas, icon: AlertCircle, color: "text-red-600", href: "/planillas" },
    ];
    planillasRecientes = recientes;
  }

  if (rol === "JEFATURA") {
    const [pendientes, visadas, revocadas, recientes] = await Promise.all([
      prisma.planilla.count({ where: { estado: "ENVIADA" } }),
      prisma.planilla.count({ where: { estado: "VISADA" } }),
      prisma.planilla.count({ where: { estado: "REVOCADA" } }),
      prisma.planilla.findMany({
        where: { estado: { in: ["ENVIADA", "VISADA", "REVOCADA"] } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { seccion: true },
      }),
    ]);
    stats = [
      { label: "Pendientes de revisión", value: pendientes, icon: ClipboardCheck, color: "text-yellow-600", href: "/jefatura/pendientes" },
      { label: "Visadas", value: visadas, icon: CheckCircle2, color: "text-green-600", href: "/jefatura/planillas" },
      { label: "Revocadas", value: revocadas, icon: AlertCircle, color: "text-red-600", href: "/jefatura/planillas" },
    ];
    planillasRecientes = recientes;
  }

  if (rol === "PERSONAL") {
    const [pendientes, cargadas, recientes] = await Promise.all([
      prisma.planilla.count({ where: { estado: "VISADA" } }),
      prisma.planilla.count({ where: { estado: "CARGADA" } }),
      prisma.planilla.findMany({
        where: { estado: { in: ["VISADA", "CARGADA"] } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { seccion: true },
      }),
    ]);
    stats = [
      { label: "Pendientes de carga", value: pendientes, icon: Package, color: "text-yellow-600", href: "/personal/pendientes" },
      { label: "Cargadas en sistema", value: cargadas, icon: CheckCircle2, color: "text-green-600", href: "/personal/historial" },
    ];
    planillasRecientes = recientes;
  }

  if (rol === "ADMIN") {
    const [usuarios, planillasTotal, enviadas, visadas] = await Promise.all([
      prisma.user.count({ where: { activo: true } }),
      prisma.planilla.count(),
      prisma.planilla.count({ where: { estado: "ENVIADA" } }),
      prisma.planilla.count({ where: { estado: "VISADA" } }),
    ]);
    stats = [
      { label: "Usuarios activos", value: usuarios, icon: TrendingUp, color: "text-blue-600", href: "/admin/usuarios" },
      { label: "Total planillas", value: planillasTotal, icon: FileText, color: "text-gray-600", href: "/admin/planillas" },
      { label: "En revisión", value: enviadas, icon: Clock, color: "text-yellow-600", href: "/admin/planillas" },
      { label: "Visadas", value: visadas, icon: CheckCircle2, color: "text-green-600", href: "/admin/planillas" },
    ];
    planillasRecientes = await prisma.planilla.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { seccion: true },
    });
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="rounded-lg border border-l-4 border-l-bombero-rojo bg-white p-4">
          <p className="text-sm text-gray-600">Bienvenido/a</p>
          <h2 className="text-lg font-semibold text-gray-800">
            {session.user.nombre} {session.user.apellido}
          </h2>
          {session.user.seccionNombre && (
            <p className="text-sm text-bombero-rojo font-medium">{session.user.seccionNombre}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.href + stat.label} href={stat.href}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={`rounded-full bg-gray-100 p-3 ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Planillas recientes */}
        {planillasRecientes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {planillasRecientes.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {p.seccion.nombre} — {getMesNombre(p.mes)} {p.anio}
                      </p>
                      <p className="text-xs text-gray-500">{formatFecha(p.updatedAt)}</p>
                    </div>
                    <EstadoBadge estado={p.estado} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
