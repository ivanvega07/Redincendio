import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { EstadoPlanilla } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function getMesNombre(mes: number): string {
  return MESES[mes - 1] ?? `Mes ${mes}`;
}

export function formatFecha(date: Date | string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ESTADO_LABELS: Record<EstadoPlanilla, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  VISADA: "Visada",
  REVOCADA: "Revocada",
  CARGADA: "Cargada",
};

export const ESTADO_COLORS: Record<EstadoPlanilla, string> = {
  BORRADOR: "bg-gray-100 text-gray-700 border-gray-300",
  ENVIADA: "bg-yellow-100 text-yellow-800 border-yellow-300",
  VISADA: "bg-green-100 text-green-800 border-green-300",
  REVOCADA: "bg-red-100 text-red-800 border-red-300",
  CARGADA: "bg-blue-100 text-blue-800 border-blue-300",
};

export const ROL_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  JEFE_SECCION: "Jefe de Sección",
  JEFATURA: "Jefatura",
  PERSONAL: "Sección Personal",
};
