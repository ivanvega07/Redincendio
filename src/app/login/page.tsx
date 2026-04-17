"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Flame, Lock, User, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validations";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Usuario o contraseña incorrectos");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Left panel */}
      <div className="hidden w-1/2 flex-col items-center justify-center bg-bombero-rojo p-12 lg:flex">
        <Flame className="mb-6 h-24 w-24 text-white/80" />
        <h1 className="text-center text-4xl font-bold text-white">ABVPA</h1>
        <p className="mt-2 text-center text-lg text-white/80">
          Asociación Bomberos Voluntarios
          <br />
          de Punta Alta
        </p>
        <div className="mt-8 rounded-lg bg-white/10 p-6 text-white/70 text-sm text-center">
          <p className="font-semibold text-white">Sistema de Puntajes</p>
          <p className="mt-1">Gestión mensual de evaluación de puntaje por sección</p>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bombero-rojo">
              <Flame className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">ABVPA</h1>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Iniciar sesión</h2>
              <p className="mt-1 text-sm text-gray-500">
                Ingrese sus credenciales para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="username"
                    placeholder="nombre.apellido"
                    className="pl-9"
                    {...register("username")}
                    disabled={isLoading}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-red-500">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    {...register("password")}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-bombero-rojo hover:bg-bombero-rojo-oscuro"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Asociación Bomberos Voluntarios de Punta Alta © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
