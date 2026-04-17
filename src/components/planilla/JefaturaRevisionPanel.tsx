"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "./EstadoBadge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatFecha, getMesNombre } from "@/lib/utils";
import {
  CheckCircle2, XCircle, ArrowLeft, Loader2, Clock, FileDown, History,
} from "lucide-react";
import Link from "next/link";
import { Role } from "@prisma/client";

interface Bombero { id: string; nombre: string; apellido: string; dni: string }
interface Categoria { id: string; nombre: string; puntajeMax: number }
interface Calificacion { bomberoId: string; categoriaId: string; puntaje: number; observacion?: string | null }
interface HistorialEntry { id: string; accion: string; fecha: string; detalle?: string | null; usuario: { nombre: string; apellido: string } }

interface PlanillaData {
  id: string; mes: number; anio: number; estado: string;
  seccion: { nombre: string };
  calificaciones: Calificacion[];
  historial: HistorialEntry[];
  firmadaPorJefe: boolean; fechaFirmaJefe?: string | null;
  jefe?: { nombre: string; apellido: string } | null;
  visadaPorJefatura: boolean; fechaVisado?: string | null;
  jefatura?: { nombre: string; apellido: string } | null;
  cargadaEnSistema: boolean; fechaCarga?: string | null;
  personal?: { nombre: string; apellido: string } | null;
}

interface Props {
  planilla: PlanillaData;
  bomberos: Bombero[];
  categorias: Categoria[];
  userRol: Role;
}

export function JefaturaRevisionPanel({ planilla, bomberos, categorias }: Props) {
  const router = useRouter();
  const [showVisarModal, setShowVisarModal] = useState(false);
  const [showRevocarModal, setShowRevocarModal] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);

  const calMap: Record<string, number> = {};
  for (const c of planilla.calificaciones) {
    calMap[`${c.bomberoId}:${c.categoriaId}`] = c.puntaje;
  }

  const getTotal = (bomberoId: string) =>
    categorias.reduce((s, c) => s + (calMap[`${bomberoId}:${c.id}`] ?? 0), 0);

  const handleVisar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/planillas/${planilla.id}/visar`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error); return; }
      toast.success("Planilla visada correctamente");
      setShowVisarModal(false);
      router.push("/jefatura/pendientes");
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setLoading(false); }
  };

  const handleRevocar = async () => {
    if (motivo.trim().length < 10) {
      toast.error("El motivo debe tener al menos 10 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/planillas/${planilla.id}/revocar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error); return; }
      toast.success("Planilla revocada. El Jefe de Sección fue notificado.");
      setShowRevocarModal(false);
      router.push("/jefatura/pendientes");
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setLoading(false); }
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`ABVPA — Sistema de Puntajes`, 14, 16);
    doc.setFontSize(11);
    doc.text(`Sección: ${planilla.seccion.nombre} | Período: ${getMesNombre(planilla.mes)} ${planilla.anio}`, 14, 24);
    const head = [["Bombero", "DNI", ...categorias.map((c) => c.nombre), "Total"]];
    const body = bomberos.map((b) => [
      `${b.apellido}, ${b.nombre}`, b.dni,
      ...categorias.map((c) => calMap[`${b.id}:${c.id}`] ?? 0),
      getTotal(b.id),
    ]);
    autoTable(doc, { head, body, startY: 30, styles: { fontSize: 8 }, headStyles: { fillColor: [178, 34, 34] } });
    const y = (doc as any).lastAutoTable.finalY + 10;
    if (planilla.jefe) doc.text(`Firma Jefe: ${planilla.jefe.nombre} ${planilla.jefe.apellido} — ${formatFecha(planilla.fechaFirmaJefe ?? "")}`, 14, y);
    if (planilla.jefatura) doc.text(`Visado: ${planilla.jefatura.nombre} ${planilla.jefatura.apellido} — ${formatFecha(planilla.fechaVisado ?? "")}`, 14, y + 7);
    doc.save(`planilla_${planilla.seccion.nombre}_${planilla.mes}_${planilla.anio}.pdf`);
    toast.success("PDF generado");
  };

  const canActuar = planilla.estado === "ENVIADA";
  const canExport = ["VISADA", "CARGADA"].includes(planilla.estado);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/jefatura/pendientes">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>
        </Link>
        <EstadoBadge estado={planilla.estado as any} />
        {canExport && (
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />Exportar PDF
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setShowHistorial(true)}>
          <History className="mr-2 h-4 w-4" />Historial
        </Button>
      </div>

      {/* Firmas */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Firma Jefe de Sección", firmado: planilla.firmadaPorJefe, nombre: planilla.jefe ? `${planilla.jefe.nombre} ${planilla.jefe.apellido}` : null, fecha: planilla.fechaFirmaJefe ?? null },
          { label: "Visado Jefatura", firmado: planilla.visadaPorJefatura, nombre: planilla.jefatura ? `${planilla.jefatura.nombre} ${planilla.jefatura.apellido}` : null, fecha: planilla.fechaVisado ?? null },
          { label: "Cargada en sistema", firmado: planilla.cargadaEnSistema, nombre: planilla.personal ? `${planilla.personal.nombre} ${planilla.personal.apellido}` : null, fecha: planilla.fechaCarga ?? null },
        ].map((f) => (
          <div key={f.label} className={`rounded-lg border p-3 ${f.firmado ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
            <p className="text-xs font-medium text-gray-600">{f.label}</p>
            {f.firmado ? (
              <div className="mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs font-semibold text-green-800">{f.nombre}</p>
                  <p className="text-xs text-green-600">{formatFecha(f.fecha ?? "")}</p>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <p className="text-xs text-gray-400">Pendiente</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Calificaciones (solo lectura)</CardTitle>
        </CardHeader>
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
                      <td key={c.id} className="px-3 py-3 text-center font-medium">
                        {calMap[`${b.id}:${c.id}`] ?? 0}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-bold text-bombero-rojo">{getTotal(b.id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Acciones jefatura */}
      {canActuar && (
        <div className="flex gap-3 justify-end">
          <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={() => setShowRevocarModal(true)}>
            <XCircle className="mr-2 h-4 w-4" />Revocar con observaciones
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowVisarModal(true)}>
            <CheckCircle2 className="mr-2 h-4 w-4" />Visar (Aprobar)
          </Button>
        </div>
      )}

      {/* Modal visar */}
      <Dialog open={showVisarModal} onOpenChange={setShowVisarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar visado</DialogTitle>
            <DialogDescription>
              Va a aprobar la planilla de <strong>{getMesNombre(planilla.mes)} {planilla.anio}</strong> — {planilla.seccion.nombre}.
              Pasará a Sección Personal para su carga en el sistema oficial.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVisarModal(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleVisar} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Visar planilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal revocar */}
      <Dialog open={showRevocarModal} onOpenChange={setShowRevocarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revocar planilla</DialogTitle>
            <DialogDescription>
              Indique el motivo de la revocación. El Jefe de Sección recibirá este mensaje y deberá corregir la planilla.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo (requerido, mínimo 10 caracteres)</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describa los problemas encontrados en la planilla..."
              rows={4}
            />
            <p className="text-xs text-gray-400">{motivo.length} caracteres</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevocarModal(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRevocar} disabled={loading || motivo.trim().length < 10}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Revocar planilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal historial */}
      <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Historial de la planilla</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {planilla.historial.map((h) => (
              <div key={h.id} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-bombero-rojo mt-1.5" />
                  <div className="flex-1 w-px bg-gray-200" />
                </div>
                <div className="pb-3">
                  <p className="font-medium text-gray-800">{h.accion}</p>
                  <p className="text-xs text-gray-500">{formatFecha(h.fecha)}</p>
                  {h.detalle && <p className="text-xs text-gray-600 mt-0.5">{h.detalle}</p>}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
