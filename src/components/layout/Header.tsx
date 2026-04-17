"use client";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import { ROL_LABELS } from "@/lib/utils";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        <div className="flex items-center gap-4">
          <button className="relative rounded-full p-1.5 text-gray-500 hover:bg-gray-100">
            <Bell className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bombero-rojo text-sm font-bold text-white">
              {user?.nombre?.[0]}
              {user?.apellido?.[0]}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">
                {user?.nombre} {user?.apellido}
              </p>
              <p className="text-xs text-gray-500">
                {user?.rol ? ROL_LABELS[user.rol] : ""}
                {user?.seccionNombre ? ` · ${user.seccionNombre}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
