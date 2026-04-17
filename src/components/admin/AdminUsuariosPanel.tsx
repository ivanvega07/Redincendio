"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ROL_LABELS } from "@/lib/utils";
import { Plus, Pencil, UserX, Loader2 } from "lucide-react";
import { Role } from "@prisma/client";

interface Usuario {
  id: string; username: string; nombre: string; apellido: string;
  dni: string; rol: Role; activo: boolean; seccionId: string | null;
  seccion: { id: string; nombre: string } | null;
}
interface Seccion { id: string; nombre: string; numero: number }

interface Props { usuarios: Usuario[]; secciones: Seccion[] }

const ROLES: Role[] = ["ADMIN", "JEFE_SECCION", "JEFATURA", "PERSONAL"];
const EMPTY_FORM = { username: "", password: "", nombre: "", apellido: "", dni: "", rol: "JEFE_SECCION" as Role, seccionId: "" };

export function AdminUsuariosPanel({ usuarios: initial, secciones }: Props) {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const openCreate = () => { setEditando(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (u: Usuario) => {
    setEditando(u);
    setForm({ username: u.username, password: "", nombre: u.nombre, apellido: u.apellido, dni: u.dni, rol: u.rol, seccionId: u.seccionId ?? "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...form, seccionId: form.seccionId || null };
      if (!editando && !form.password) { toast.error("Contraseña requerida"); return; }
      const url = editando ? `/api/usuarios/${editando.id}` : "/api/usuarios";
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "Error"); return; }
      toast.success(editando ? "Usuario actualizado" : "Usuario creado");
      setShowModal(false);
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setLoading(false); }
  };

  const handleDesactivar = async (id: string) => {
    if (!confirm("¿Desactivar este usuario?")) return;
    const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Usuario desactivado"); router.refresh(); }
    else toast.error("Error al desactivar");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{usuarios.length} usuarios registrados</p>
        <Button className="bg-bombero-rojo hover:bg-bombero-rojo-oscuro" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />Nuevo usuario
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nombre</th>
              <th className="px-4 py-3 text-left font-medium">Usuario</th>
              <th className="px-4 py-3 text-left font-medium">DNI</th>
              <th className="px-4 py-3 text-left font-medium">Rol</th>
              <th className="px-4 py-3 text-left font-medium">Sección</th>
              <th className="px-4 py-3 text-left font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {usuarios.map((u) => (
              <tr key={u.id} className={`hover:bg-gray-50 ${!u.activo ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-medium text-gray-800">{u.apellido}, {u.nombre}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.username}</td>
                <td className="px-4 py-3 text-gray-600">{u.dni}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">{ROL_LABELS[u.rol]}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.seccion?.nombre ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {u.activo && (
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDesactivar(u.id)}>
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Apellido</Label>
              <Input value={form.apellido} onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>DNI</Label>
              <Input value={form.dni} onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>{editando ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Rol</Label>
              <Select value={form.rol} onValueChange={(v) => setForm((f) => ({ ...f, rol: v as Role }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{ROL_LABELS[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Sección (opcional)</Label>
              <Select value={form.seccionId || "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, seccionId: v === "__none__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Sin sección" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin sección</SelectItem>
                  {secciones.map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button className="bg-bombero-rojo hover:bg-bombero-rojo-oscuro" onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editando ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
