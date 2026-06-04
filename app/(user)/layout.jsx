import { Navbar } from "@/components/layout/Navbar";
import { UserSidebar } from "@/components/layout/UserSidebar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";

export default function UserLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1 max-w-7xl w-full mx-auto">
        <UserSidebar />
        <main className="flex-1 p-6 md:p-8 bg-background overflow-x-hidden pb-20 md:pb-8">
          {children}
        </main>
      </div>
      <BottomTabBar />
    </div>
  );
}
