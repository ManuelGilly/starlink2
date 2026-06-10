import {
  BarChart3,
  Boxes,
  Package,
  Users,
  UserCog,
  Wallet,
  Warehouse,
  Bell,
  CreditCard,
  ShieldCheck,
  FileText,
  Inbox,
  ShoppingCart,
  Banknote,
  BadgeDollarSign,
  Megaphone,
  Wifi,
  LifeBuoy,
  Truck,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  section?: string;
};

export const NAV_ITEMS: NavItem[] = [
  // Principal
  { href: "/dashboard",       label: "Dashboard",       icon: BarChart3,  roles: ["ADMIN", "INVENTARIO"], section: "Principal" },

  // Ventas y cobros (todo el dinero entrante)
  { href: "/ventas",          label: "Ventas",          icon: ShoppingCart,    roles: ["ADMIN", "INVENTARIO"], section: "Ventas y cobros" },
  { href: "/cobros",          label: "Cobros de planes", icon: BadgeDollarSign, roles: ["ADMIN", "INVENTARIO"], section: "Ventas y cobros" },
  { href: "/pagos",           label: "Pagos",           icon: Wallet,          roles: ["ADMIN"],               section: "Ventas y cobros" },
  { href: "/solicitudes-activacion", label: "Solicitudes", icon: Inbox,       roles: ["ADMIN"],               section: "Ventas y cobros" },

  // Catálogo e inventario
  { href: "/productos",       label: "Productos",       icon: Package,    roles: ["ADMIN", "INVENTARIO"], section: "Catálogo e inventario" },
  { href: "/planes",          label: "Planes",          icon: Boxes,      roles: ["ADMIN", "INVENTARIO"], section: "Catálogo e inventario" },
  { href: "/compras",         label: "Compras / Lotes", icon: Truck,      roles: ["ADMIN", "INVENTARIO"], section: "Catálogo e inventario" },
  { href: "/inventario",      label: "Inventario",      icon: Warehouse,  roles: ["ADMIN", "INVENTARIO"], section: "Catálogo e inventario" },
  { href: "/equipos",         label: "Equipos",         icon: Wifi,       roles: ["ADMIN", "INVENTARIO"], section: "Catálogo e inventario" },

  // Clientes
  { href: "/clientes",        label: "Clientes",        icon: Users,      roles: ["ADMIN", "INVENTARIO"], section: "Clientes" },
  { href: "/soporte",         label: "Soporte",         icon: LifeBuoy,   roles: ["ADMIN", "INVENTARIO"], section: "Clientes" },

  // Marketing
  { href: "/marketing",       label: "Marketing",       icon: Megaphone,  roles: ["ADMIN"],               section: "Marketing" },

  // Configuración
  { href: "/metodos-pago",    label: "Métodos de pago", icon: Banknote,   roles: ["ADMIN"],               section: "Configuración" },
  { href: "/usuarios",        label: "Usuarios",        icon: UserCog,    roles: ["ADMIN"],               section: "Configuración" },
  { href: "/notificaciones",  label: "Notificaciones",  icon: Bell,       roles: ["ADMIN"],               section: "Configuración" },
  { href: "/bitacora",        label: "Bitácora",        icon: FileText,   roles: ["ADMIN"],               section: "Configuración" },

  // Cliente
  { href: "/mi-cuenta",       label: "Mi cuenta",       icon: CreditCard, roles: ["CLIENTE"],             section: "Mi cuenta" },
  { href: "/mi-cuenta/pagos", label: "Mis pagos",       icon: Wallet,     roles: ["CLIENTE"],             section: "Mi cuenta" },
  { href: "/mi-cuenta/garantias", label: "Garantías",   icon: ShieldCheck,roles: ["CLIENTE"],             section: "Mi cuenta" },
];

/**
 * Deriva el breadcrumb (sección › item [› detalle]) desde la ruta actual,
 * tomando el item de navegación cuyo href es el prefijo más largo que coincide.
 */
export function breadcrumbFor(pathname: string): { section?: string; label: string; href: string; isDetail: boolean } | null {
  const match = NAV_ITEMS
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (!match) return null;
  return { section: match.section, label: match.label, href: match.href, isDetail: pathname !== match.href };
}
