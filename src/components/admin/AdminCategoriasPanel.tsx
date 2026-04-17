"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Loader2, ToggleLeft, ToggleRight } from "lucide-react";

interface Categoria { id: string; nombre: string; descripcion: string | null; puntajeMax: number; orden: number; activa: boolean }
interface Props { categorias: Categoria[] }

const EMPTY = { nombre: "", descripcion: "", puntajeMax: 10, orden: 0, activa: true };

export function AdminCategoriasPanel({ categorias: initial }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [loading, setLoading] = useState(false);

  const openCreate = () => { setEditando(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (c: Categoria) => {
    setEditando(c);
    setForm({ nombre: c.nombre, descripcion: c.descripcion ?? "", puntajeMax: c.puntajeMax, orden: c.orden, activa: c.activa });
    setShowModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...form, descripcion: form.descripcion || null, puntajeMax: Number(form.puntajeMax), orden: Number(form.orden) };
      const url = editando ? `/api/categorias/${editando.id}` : "/api/categorias";
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "Error"); return; }
      toast.success(editando ? "Categoría actualizada" : "Categoría creada");
      setShowModal(false);
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setLoading(false); }
  };

  const handleToggle = async (c: Categoria) => {
    const res = await fetch(`/api/categorias/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !c.activa }),
    });
    if (res.ok) { toast.success(c.activa ? "Categoría desactivada" : "Categoría activada"); router.refresh(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{initial.length} categorías</p>
        <Button className="bg-bombero-rojo hover:bg-bombero-rojo-oscuro" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />Nueva categoría
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Orden</th>
              <th className="px-4 py-3 text-left font-medium">Nombre</th>
              <th className="px-4 py-3 text-left font-medium">Descripción</th>
              <th className="px-4 py-3 text-center font-medium">Puntaje Máx.</th>
              <th className="px-4 py-3 text-center font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {initial.map((c) => (
              <tr key={c.id} className={`hover:bg-gray-50 ${!c.activa ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 text-gray-600">{c.orden}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{c.nombre}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.descripcion ?? "—"}</td>
                <td className="px-4 py-3 text-center font-bold text-bombero-rojo">{c.puntajeMax}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.activa ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(c)}>
                    {c.activa ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editando ? "Editar categoría" : "Nueva categoría"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Descripción (opcional)</Label>
              <Textarea value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Puntaje máximo</Label>
                <Input type="number" min={1} value={form.puntajeMax} onChange={(e) => setForm((f) => ({ ...f, puntajeMax: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="space-y-1">
                <Label>Orden de visualización</Label>
                <Input type="number" min={0} value={form.orden} onChange={(e) => setForm((f) => ({ ...f, orden: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button className="bg-bombero-rojo hover:bg-bombero-rojo-oscuro" onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editando ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
