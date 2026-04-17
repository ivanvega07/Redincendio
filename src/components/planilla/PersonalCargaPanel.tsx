"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "./EstadoBadge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatFecha, getMesNombre } from "@/lib/utils";
import { CheckCircle2, ArrowLeft, Loader2, Upload, FileDown, Clock } from "lucide-react";
import Link from "next/link";

interface Bombero { id: string; nombre: string; apellido: string; dni: string }
interface Categoria { id: string; nombre: string; puntajeMax: number }
interface Calificacion { bomberoId: string; categoriaId: string; puntaje: number }

interface PlanillaData {
  id: string; mes: number; anio: number; estado: string;
  seccion: { nombre: string };
  calificaciones: Calificacion[];
  firmadaPorJefe: boolean; fechaFirmaJefe?: string | null;
  jefe?: { nombre: string; apellido: string } | null;
  visadaPorJefatura: boolean; fechaVisado?: string | null;
  jefatura?: { nombre: string; apellido: string } | null;
  cargadaEnSistema: boolean; fechaCarga?: string | null;
  personal?: { nombre: string; apellido: string } | null;
}

interface Props { planilla: PlanillaData; bomberos: Bombero[]; categorias: Categoria[] }

export function PersonalCargaPanel({ planilla, bomberos, categorias }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const calMap: Record<string, number> = {};
  for (const c of planilla.calificaciones) {
    calMap[`${c.bomberoId}:${c.categoriaId}`] = c.puntaje;
  }
  const getTotal = (bid: string) => categorias.reduce((s, c) => s + (calMap[`${bid}:${c.id}`] ?? 0), 0);

  const handleCargar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/planillas/${planilla.id}/cargar`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error); return; }
      toast.success("Planilla marcada como cargada en sistema");
      setShowModal(false);
      router.push("/personal/historial");
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setLoading(false); }
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("ABVPA — Sistema de Puntajes", 14, 16);
    doc.setFontSize(11);
    doc.text(`Sección: ${planilla.seccion.nombre} | ${getMesNombre(planilla.mes)} ${planilla.anio}`, 14, 24);
    const head = [["Bombero", "DNI", ...categorias.map((c) => c.nombre), "Total"]];
    const body = bomberos.map((b) => [
      `${b.apellido}, ${b.nombre}`, b.dni,
      ...categorias.map((c) => calMap[`${b.id}:${c.id}`] ?? 0), getTotal(b.id),
    ]);
    autoTable(doc, { head, body, startY: 30, styles: { fontSize: 8 }, headStyles: { fillColor: [178, 34, 34] } });
    const y = (doc as any).lastAutoTable.finalY + 10;
    if (planilla.jefe) doc.text(`Firma Jefe: ${planilla.jefe.nombre} ${planilla.jefe.apellido} — ${formatFecha(planilla.fechaFirmaJefe ?? "")}`, 14, y);
    if (planilla.jefatura) doc.text(`Visado: ${planilla.jefatura.nombre} ${planilla.jefatura.apellido} — ${formatFecha(planilla.fechaVisado ?? "")}`, 14, y + 7);
    doc.save(`planilla_${planilla.seccion.nombre}_${planilla.mes}_${planilla.anio}.pdf`);
    toast.success("PDF generado");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/personal/pendientes">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>
        </Link>
        <EstadoBadge estado={planilla.estado as any} />
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <FileDown className="mr-2 h-4 w-4" />Exportar PDF
        </Button>
      </div>

      {/* Firmas */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Firma Jefe de Sección", f: planilla.firmadaPorJefe, n: planilla.jefe ? `${planilla.jefe.nombre} ${planilla.jefe.apellido}` : null, d: planilla.fechaFirmaJefe ?? null },
          { label: "Visado Jefatura", f: planilla.visadaPorJefatura, n: planilla.jefatura ? `${planilla.jefatura.nombre} ${planilla.jefatura.apellido}` : null, d: planilla.fechaVisado ?? null },
          { label: "Cargada en sistema", f: planilla.cargadaEnSistema, n: planilla.personal ? `${planilla.personal.nombre} ${planilla.personal.apellido}` : null, d: planilla.fechaCarga ?? null },
        ].map((x) => (
          <div key={x.label} className={`rounded-lg border p-3 ${x.f ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
            <p className="text-xs font-medium text-gray-600">{x.label}</p>
            {x.f ? (
              <div className="mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs font-semibold text-green-800">{x.n}</p>
                  <p className="text-xs text-green-600">{formatFecha(x.d ?? "")}</p>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-400" /><p className="text-xs text-gray-400">Pendiente</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Calificaciones</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Bombero</th>
                  {categorias.map((c) => (
                    <th key={c.id} className="px-3 py-3 text-center font-medium text-gray-600 text-xs">
                      {c.nombre}<br /><span className="text-gray-400">Máx {c.puntajeMax}</span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-bold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bomberos.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {b.apellido}, {b.nombre}
                      <div className="text-xs text-gray-400">DNI: {b.dni}</div>
                    </td>
                    {categorias.map((c) => (
                      <td key={c.id} className="px-3 py-3 text-center font-medium">{calMap[`${b.id}:${c.id}`] ?? 0}</td>
                    ))}
                    <td className="px-4 py-3 text-center font-bold text-bombero-rojo">{getTotal(b.id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {planilla.estado === "VISADA" && (
        <div className="flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Marcar como cargada en sistema
          </Button>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar carga en sistema</DialogTitle>
            <DialogDescription>
              ¿Confirma que la planilla de <strong>{getMesNombre(planilla.mes)} {planilla.anio}</strong> —{" "}
              {planilla.seccion.nombre} fue cargada correctamente en el sistema oficial?
              Esta acción no se puede revertir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCargar} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Confirmar carga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
