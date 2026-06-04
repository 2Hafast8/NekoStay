import { Navbar } from "@/components/layout/Navbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1 max-w-7xl w-full mx-auto">
        <AdminSidebar />
        <main className="flex-1 p-6 md:p-8 bg-background overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
