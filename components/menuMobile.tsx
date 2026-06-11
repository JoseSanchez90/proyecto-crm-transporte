"use client";

import { X } from "lucide-react";
import { TbMenu3 } from "react-icons/tb";
import { useSidebar } from "@/lib/sidebar-context";

export default function MenuMobile() {
  const { isOpen, toggle } = useSidebar();

  return (
    <header className="md:hidden bg-gray-100 rounded-b-4xl border-b border-gray-300 flex h-16 items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold font-serif">MiBuss</h1>
      </div>
      <button
        onClick={toggle}
        className="w-24 h-10 flex items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 cursor-pointer"
      >
        {isOpen ? (
          <div className="flex justify-center items-center gap-1">
            <X className="w-5 h-5" />
            <span className="font-semibold">Cerrar</span>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-1">
            <TbMenu3 className="w-5 h-5" />
            <span className="font-semibold">Menu</span>
          </div>
        )}
      </button>
    </header>
  );
}
