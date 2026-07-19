import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth-service";
import { AdminLayoutWrapper } from "@/components/admin/admin-layout-wrapper";

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
    <AdminLayoutWrapper
      role={user.role}
      email={user.email}
      profileName={user.profile_name}
    >
      {children}
    </AdminLayoutWrapper>
  );
}
