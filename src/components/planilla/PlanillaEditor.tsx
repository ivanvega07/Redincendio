"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "./EstadoBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatFecha, getMesNombre } from "@/lib/utils";
import {
  Save, Send, CheckCircle2, AlertCircle, Clock, ArrowLeft,
  Loader2, FileDown, History,
} from "lucide-react";
import Link from "next/link";
import { Role } from "@prisma/client";

interface Bombero { id: string; nombre: string; apellido: string; dni: string }
interface Categoria { id: string; nombre: string; puntajeMax: number; orden: number }
interface Calificacion { bomberoId: string; categoriaId: string; puntaje: number; observacion?: string | null }
interface HistorialEntry { id: string; accion: string; fecha: string; detalle?: string | null; usuario: { nombre: string; apellido: string; rol: string } }

interface PlanillaData {
  id: string; mes: number; anio: number; estado: string;
  seccion: { nombre: string };
  motivoRevocacion?: string | null;
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
  canEdit: boolean;
  userRol: Role;
  userId: string;
}

export function PlanillaEditor({ planilla, bomberos, categorias, canEdit, userRol }: Props) {
  const router = useRouter();

  // Build calificaciones map: key = `${bomberoId}:${categoriaId}`
  const initCalificaciones = () => {
    const map: Record<string, { puntaje: number; observacion: string }> = {};
    for (const c of planilla.calificaciones) {
      map[`${c.bomberoId}:${c.categoriaId}`] = {
        puntaje: c.puntaje,
        observacion: c.observacion ?? "",
      };
    }
    return map;
  };

  const [calificaciones, setCalificaciones] = useState(initCalificaciones);
  const [saving, setSaving] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [showFirmarModal, setShowFirmarModal] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);

  const setCalif = useCallback(
    (bomberoId: string, categoriaId: string, puntaje: number, observacion?: string) => {
      const key = `${bomberoId}:${categoriaId}`;
      setCalificaciones((prev) => ({
        ...prev,
        [key]: {
          puntaje: Math.max(0, puntaje),
          observacion: observacion ?? prev[key]?.observacion ?? "",
        },
      }));
    },
    []
  );

  const setObservacion = useCallback(
    (bomberoId: string, categoriaId: string, observacion: string) => {
      const key = `${bomberoId}:${categoriaId}`;
      setCalificaciones((prev) => ({
        ...prev,
        [key]: { puntaje: prev[key]?.puntaje ?? 0, observacion },
      }));
    },
    []
  );

  const getTotalBombero = (bomberoId: string) => {
    return categorias.reduce((sum, cat) => {
      return sum + (calificaciones[`${bomberoId}:${cat.id}`]?.puntaje ?? 0);
    }, 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(calificaciones).map(([key, val]) => {
        const [bomberoId, categoriaId] = key.split(":");
        return { bomberoId, categoriaId, puntaje: val.puntaje, observacion: val.observacion || null };
      });

      const res = await fetch(`/api/planillas/${planilla.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calificaciones: payload }),
      });

      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Error al guardar");
        return;
      }
      toast.success("Borrador guardado");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleFirmar = async () => {
    // Save first, then sign
    setFirmando(true);
    try {
      await handleSave();

      const res = await fetch(`/api/planillas/${planilla.id}/firmar`, {
        method: "POST",
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error ?? "Error al firmar");
        return;
      }
      toast.success("Planilla firmada y enviada a Jefatura");
      setShowFirmarModal(false);
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setFirmando(false);
    }
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`ABVPA — Sistema de Puntajes`, 14, 16);
    doc.setFontSize(11);
    doc.text(
      `Sección: ${planilla.seccion.nombre} | Período: ${getMesNombre(planilla.mes)} ${planilla.anio}`,
      14, 24
    );
    doc.setFontSize(9);
    doc.text(`Estado: ${planilla.estado}`, 14, 31);

    const head = [["Bombero", "DNI", ...categorias.map((c) => `${c.nombre}\n(Max ${c.puntajeMax})`), "Total"]];
    const body = bomberos.map((b) => [
      `${b.apellido}, ${b.nombre}`,
      b.dni,
      ...categorias.map((c) => calificaciones[`${b.id}:${c.id}`]?.puntaje ?? 0),
      getTotalBombero(b.id),
    ]);

    autoTable(doc, { head, body, startY: 36, styles: { fontSize: 8 }, headStyles: { fillColor: [178, 34, 34] } });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    if (planilla.firmadaPorJefe && planilla.jefe) {
      doc.text(`Firma Jefe: ${planilla.jefe.nombre} ${planilla.jefe.apellido} — ${formatFecha(planilla.fechaFirmaJefe ?? "")}`, 14, finalY);
    }
    if (planilla.visadaPorJefatura && planilla.jefatura) {
      doc.text(`Visado Jefatura: ${planilla.jefatura.nombre} ${planilla.jefatura.apellido} — ${formatFecha(planilla.fechaVisado ?? "")}`, 14, finalY + 7);
    }

    doc.save(`planilla_${planilla.seccion.nombre}_${planilla.mes}_${planilla.anio}.pdf`);
    toast.success("PDF generado");
  };

  const canExportPDF = ["VISADA", "CARGADA"].includes(planilla.estado);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={userRol === "JEFE_SECCION" ? "/planillas" : userRol === "JEFATURA" ? "/jefatura/planillas" : "/personal/pendientes"}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <EstadoBadge estado={planilla.estado as any} />
        {canExportPDF && (
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setShowHistorial(true)}>
          <History className="mr-2 h-4 w-4" />
          Historial
        </Button>
      </div>

      {/* Motivo de revocación */}
      {planilla.estado === "REVOCADA" && planilla.motivoRevocacion && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Planilla revocada por Jefatura:</strong> {planilla.motivoRevocacion}
          </AlertDescription>
        </Alert>
      )}

      {/* Firmas */}
      <div className="grid gap-3 sm:grid-cols-3">
        <FirmaCard
          label="Firma del Jefe de Sección"
          firmado={planilla.firmadaPorJefe}
          nombre={planilla.jefe ? `${planilla.jefe.nombre} ${planilla.jefe.apellido}` : null}
          fecha={planilla.fechaFirmaJefe ?? null}
        />
        <FirmaCard
          label="Visado por Jefatura"
          firmado={planilla.visadaPorJefatura}
          nombre={planilla.jefatura ? `${planilla.jefatura.nombre} ${planilla.jefatura.apellido}` : null}
          fecha={planilla.fechaVisado ?? null}
        />
        <FirmaCard
          label="Cargada en sistema"
          firmado={planilla.cargadaEnSistema}
          nombre={planilla.personal ? `${planilla.personal.nombre} ${planilla.personal.apellido}` : null}
          fecha={planilla.fechaCarga ?? null}
        />
      </div>

      {/* Tabla de calificaciones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Calificaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600 min-w-[180px]">
                    Bombero
                  </th>
                  {categorias.map((cat) => (
                    <th key={cat.id} className="px-3 py-3 text-center font-medium text-gray-600 min-w-[100px]">
                      <div className="text-xs">{cat.nombre}</div>
                      <div className="text-xs text-gray-400">Máx: {cat.puntajeMax}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-bold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[160px]">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bomberos.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white px-4 py-3 font-medium text-gray-800">
                      {b.apellido}, {b.nombre}
                      <div className="text-xs text-gray-400">DNI: {b.dni}</div>
                    </td>
                    {categorias.map((cat) => {
                      const key = `${b.id}:${cat.id}`;
                      const val = calificaciones[key]?.puntaje ?? 0;
                      return (
                        <td key={cat.id} className="px-2 py-2 text-center">
                          {canEdit ? (
                            <input
                              type="number"
                              min={0}
                              max={cat.puntajeMax}
                              value={val}
                              onChange={(e) => setCalif(b.id, cat.id, parseInt(e.target.value) || 0)}
                              className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-bombero-rojo focus:outline-none focus:ring-1 focus:ring-bombero-rojo"
                            />
                          ) : (
                            <span className="font-medium">{val}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center font-bold text-bombero-rojo">
                      {getTotalBombero(b.id)}
                    </td>
                    <td className="px-2 py-2">
                      {canEdit ? (
                        <input
                          type="text"
                          placeholder="Observación..."
                          value={calificaciones[`${b.id}:${categorias[0]?.id}`]?.observacion ?? ""}
                          onChange={(e) => setObservacion(b.id, categorias[0]?.id ?? "", e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-bombero-rojo focus:outline-none"
                        />
                      ) : (
                        <span className="text-xs text-gray-500">
                          {calificaciones[`${b.id}:${categorias[0]?.id}`]?.observacion ?? "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      {canEdit && (
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar borrador
          </Button>
          <Button
            className="bg-bombero-rojo hover:bg-bombero-rojo-oscuro"
            onClick={() => setShowFirmarModal(true)}
          >
            <Send className="mr-2 h-4 w-4" />
            Firmar y enviar a Jefatura
          </Button>
        </div>
      )}

      {/* Modal confirmar firma */}
      <Dialog open={showFirmarModal} onOpenChange={setShowFirmarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar firma y envío</DialogTitle>
            <DialogDescription>
              Al firmar, la planilla de <strong>{getMesNombre(planilla.mes)} {planilla.anio}</strong> será
              enviada a Jefatura para su revisión. <br />
              Una vez enviada, no podrá editarse a menos que Jefatura la revoque.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFirmarModal(false)}>Cancelar</Button>
            <Button
              className="bg-bombero-rojo hover:bg-bombero-rojo-oscuro"
              onClick={handleFirmar}
              disabled={firmando}
            >
              {firmando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Confirmar y enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal historial */}
      <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Historial de la planilla</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {planilla.historial.length === 0 ? (
              <p className="text-sm text-gray-500">Sin historial</p>
            ) : (
              planilla.historial.map((h) => (
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
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FirmaCard({ label, firmado, nombre, fecha }: {
  label: string; firmado: boolean; nombre: string | null; fecha: string | null;
}) {
  return (
    <div className={`rounded-lg border p-3 ${firmado ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
      <p className="text-xs font-medium text-gray-600">{label}</p>
      {firmado ? (
        <div className="mt-1 flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-xs font-semibold text-green-800">{nombre}</p>
            <p className="text-xs text-green-600">{formatFecha(fecha ?? "")}</p>
          </div>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-1">
          <Clock className="h-4 w-4 text-gray-400" />
          <p className="text-xs text-gray-400">Pendiente</p>
        </div>
      )}
    </div>
  );
}
