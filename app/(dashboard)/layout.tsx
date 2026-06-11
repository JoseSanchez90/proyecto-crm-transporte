"use client";

import { useSidebar } from "@/lib/sidebar-context";
import Sidebar from "@/components/sidebar";
import MenuMobile from "@/components/menuMobile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, close } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}

      <div className="flex flex-1 flex-col bg-[#F8FAFC] ml-0 lg:ml-72 2xl:ml-80">
        <MenuMobile />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
