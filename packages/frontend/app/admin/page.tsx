import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "NomadNodes Admin Dashboard - Review moderation and platform management",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
