import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ok = user.roles.includes("ADMIN") || user.roles.includes("INVENTARIO");
  if (!ok) redirect("/mi-cuenta");

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
