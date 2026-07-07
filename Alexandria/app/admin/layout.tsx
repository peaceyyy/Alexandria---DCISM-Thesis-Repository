import { redirect } from "next/navigation";
import { AdminSidebar } from "@/app/admin/_components/admin-sidebar";
import { getCurrentUser } from "@/lib/services/auth-service";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const result = await getCurrentUser();
  const user = result.data;

  if (result.error?.code === "ACCOUNT_DEACTIVATED") {
    redirect("/login?reason=account-deactivated");
  }

  // Route guard: Must be logged in, and must be admin or moderator
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "admin" && user.role !== "moderator") {
    redirect("/home");
  }

  return (
    <div className="flex min-h-svh bg-[#14181c]">
      <AdminSidebar role={user.role} />
      {/* Main Content — offset by sidebar width */}
      <main
        className="flex-1 ml-[240px] min-h-svh flex flex-col"
        id="admin-main-content"
      >
        {children}
      </main>
    </div>
  );
}
