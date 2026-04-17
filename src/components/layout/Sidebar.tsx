"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, FileText, ClipboardCheck, Users, Settings,
  LogOut, Flame, ChevronRight, Package, History, UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "JEFE_SECCION", "JEFATURA", "PERSONAL"],
  },
  // JEFE_SECCION
  {
    label: "Mis Planillas",
    href: "/planillas",
    icon: FileText,
    roles: ["JEFE_SECCION"],
  },
  // JEFATURA
  {
    label: "Pendientes",
    href: "/jefatura/pendientes",
    icon: ClipboardCheck,
    roles: ["JEFATURA"],
  },
  {
    label: "Todas las Planillas",
    href: "/jefatura/planillas",
    icon: FileText,
    roles: ["JEFATURA"],
  },
  // PERSONAL
  {
    label: "Pendientes de Carga",
    href: "/personal/pendientes",
    icon: Package,
    roles: ["PERSONAL"],
  },
  {
    label: "Historial",
    href: "/personal/historial",
    icon: History,
    roles: ["PERSONAL"],
  },
  // ADMIN
  {
    label: "Usuarios",
    href: "/admin/usuarios",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "Secciones",
    href: "/admin/secciones",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    label: "Categorías",
    href: "/admin/categorias",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    label: "Todas las Planillas",
    href: "/admin/planillas",
    icon: FileText,
    roles: ["ADMIN"],
  },
  // All
  {
    label: "Mi Perfil",
    href: "/perfil",
    icon: UserCircle,
    roles: ["ADMIN", "JEFE_SECCION", "JEFATURA", "PERSONAL"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRol = session?.user?.rol;

  const visibleItems = NAV_ITEMS.filter(
    (item) => userRol && item.roles.includes(userRol)
  );

  return (
    <aside className="flex h-full w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-700 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bombero-rojo">
          <Flame className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-bombero-rojo">ABVPA</p>
          <p className="text-xs text-gray-400">Sistema de Puntajes</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-bombero-rojo text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
