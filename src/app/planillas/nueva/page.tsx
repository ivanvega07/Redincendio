"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MESES } from "@/lib/utils";

export default function NuevaPlanillaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mes, setMes] = useState<string>("");
  const [anio, setAnio] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);

  const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mes || !anio) {
      toast.error("Seleccione mes y año");
      return;
    }
    if (!session?.user.seccionId) {
      toast.error("Su usuario no tiene sección asignada");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/planillas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seccionId: session.user.seccionId,
          mes: parseInt(mes),
          anio: parseInt(anio),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al crear planilla");
        return;
      }

      toast.success("Planilla creada exitosamente");
      router.push(`/planillas/${data.id}`);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Nueva Planilla">
      <div className="mx-auto max-w-lg space-y-6">
        <Link href="/planillas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mis planillas
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Crear nueva planilla mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label>Sección</Label>
                <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {session?.user.seccionNombre ?? "—"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Mes</Label>
                  <Select value={mes} onValueChange={setMes}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES.map((m, idx) => (
                        <SelectItem key={idx + 1} value={String(idx + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Año</Label>
                  <Select value={anio} onValueChange={setAnio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {anios.map((a) => (
                        <SelectItem key={a} value={String(a)}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-bombero-rojo hover:bg-bombero-rojo-oscuro"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Crear planilla
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
