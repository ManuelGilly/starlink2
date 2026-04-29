import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
