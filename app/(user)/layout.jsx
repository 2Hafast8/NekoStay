import { Navbar } from "@/components/layout/Navbar";
import { UserSidebar } from "@/components/layout/UserSidebar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";

export default function UserLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1 w-full min-h-[calc(100vh-4rem)]">
        <UserSidebar />
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-full overflow-x-hidden pb-20 md:pb-8 transition-all duration-300">
          {children}
        </main>
      </div>
      <BottomTabBar />
    </div>
  );
}
