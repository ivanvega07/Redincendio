import { z } from "zod";
import { Role, EstadoPlanilla } from "@prisma/client";

export const loginSchema = z.object({
  username: z.string().min(1, "Usuario requerido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(50)
    .regex(/^[a-z0-9._]+$/, "Solo letras minúsculas, números, puntos y guiones bajos"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  nombre: z.string().min(1, "Nombre requerido").max(100),
  apellido: z.string().min(1, "Apellido requerido").max(100),
  dni: z.string().min(7, "DNI inválido").max(10).regex(/^\d+$/, "Solo números"),
  rol: z.nativeEnum(Role),
  seccionId: z.string().optional().nullable(),
  activo: z.boolean().optional().default(true),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .extend({
    password: z.string().min(6).optional().or(z.literal("")),
  });

export const createCategoriaSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  descripcion: z.string().optional().nullable(),
  puntajeMax: z.number().int().min(1).max(1000),
  orden: z.number().int().min(0),
  activa: z.boolean().optional().default(true),
});

export const updateCategoriaSchema = createCategoriaSchema.partial();

export const createPlanillaSchema = z.object({
  seccionId: z.string().min(1, "Sección requerida"),
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2100),
});

export const savePlanillaSchema = z.object({
  calificaciones: z.array(
    z.object({
      bomberoId: z.string(),
      categoriaId: z.string(),
      puntaje: z.number().int().min(0),
      observacion: z.string().optional().nullable(),
    })
  ),
});

export const revocarPlanillaSchema = z.object({
  motivo: z.string().min(10, "El motivo debe tener al menos 10 caracteres"),
});

export const changePasswordSchema = z
  .object({
    passwordActual: z.string().min(1, "Contraseña actual requerida"),
    passwordNueva: z.string().min(6, "Mínimo 6 caracteres"),
    passwordConfirm: z.string().min(1, "Confirme la contraseña"),
  })
  .refine((d) => d.passwordNueva === d.passwordConfirm, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirm"],
  });
