import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  return (
    <div className="admin-shell min-h-[100dvh] bg-orbita-canvas">
      <AdminSidebar email={user.email ?? ""} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
