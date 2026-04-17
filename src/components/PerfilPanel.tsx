"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, KeyRound, User } from "lucide-react";

interface Props {
  user: {
    id: string; nombre: string; apellido: string; username: string;
    dni: string; rol: string; seccionNombre: string | null; rolLabel: string;
  };
}

export function PerfilPanel({ user }: Props) {
  const { update } = useSession();
  const [pwActual, setPwActual] = useState("");
  const [pwNueva, setPwNueva] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwNueva !== pwConfirm) { toast.error("Las contraseñas no coinciden"); return; }
    if (pwNueva.length < 6) { toast.error("Mínimo 6 caracteres"); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/usuarios/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordActual: pwActual, passwordNueva: pwNueva, passwordConfirm: pwConfirm }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "Error"); return; }
      toast.success("Contraseña cambiada exitosamente");
      setPwActual(""); setPwNueva(""); setPwConfirm("");
    } catch { toast.error("Error de conexión"); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Info del usuario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Datos del perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Nombre completo</p>
            <p className="font-medium">{user.nombre} {user.apellido}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Usuario</p>
            <p className="font-mono font-medium">{user.username}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">DNI</p>
            <p className="font-medium">{user.dni}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Rol</p>
            <p className="font-medium">{user.rolLabel}</p>
          </div>
          {user.seccionNombre && (
            <div>
              <p className="text-xs text-gray-500">Sección</p>
              <p className="font-medium text-bombero-rojo">{user.seccionNombre}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            Cambiar contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePw} className="space-y-4">
            <div className="space-y-1">
              <Label>Contraseña actual</Label>
              <Input type="password" value={pwActual} onChange={(e) => setPwActual(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-1">
              <Label>Nueva contraseña</Label>
              <Input type="password" value={pwNueva} onChange={(e) => setPwNueva(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-1">
              <Label>Confirmar nueva contraseña</Label>
              <Input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="bg-bombero-rojo hover:bg-bombero-rojo-oscuro" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cambiar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
