"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  ChevronDown,
  Layers,
  BarChart3,
  LogOut,
  User,
  ArrowRight,
  X,
} from "lucide-react";
import { useSidebar } from "@/lib/sidebar-context";
import { AiFillMessage } from "react-icons/ai";
import {
  FaChartPie,
  FaTruck,
  FaUserFriends,
  FaUserTie,
  FaUser,
} from "react-icons/fa";
import { FaBoxOpen, FaClipboardUser } from "react-icons/fa6";
import { HiChartBar } from "react-icons/hi";
import { PiNoteFill } from "react-icons/pi";
import { BsFillCreditCardFill } from "react-icons/bs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function getMainMenu(isAdmin: boolean, PendingOrders: number) {
  const items = [
    { label: "Dashboard", icon: FaChartPie, href: "/dashboard" },
    { label: "Ventas", icon: HiChartBar, href: "/ventas" },
    { label: "Envíos", icon: FaTruck, href: "/envios" },
    {
      label: "Órdenes",
      icon: FaBoxOpen,
      href: "/ordenes",
      badge: { count: PendingOrders, bgColor: "bg-red-500" as const },
    },
    { label: "Clientes", icon: FaUserFriends, href: "/clientes" },
    { label: "Conductores", icon: FaClipboardUser, href: "/conductores" },
  ];
  if (isAdmin) {
    items.push({ label: "Empleados", icon: FaUserTie, href: "/usuarios" });
  }
  return items;
}

const paymentMenu = [
  { label: "Impuestos", icon: PiNoteFill, href: "/impuestos" },
  { label: "Pagos", icon: BsFillCreditCardFill, href: "/pagos" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isOpen, close } = useSidebar();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function fetchProfile() {
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => setProfileImage(data.image || null))
      .catch(() => {});
  }

  useEffect(() => {
    fetchProfile();
    window.addEventListener("profile-image-changed", fetchProfile);
    return () =>
      window.removeEventListener("profile-image-changed", fetchProfile);
  }, []);

  function fetchPendingOrders() {
    fetch("/api/shipments?status=PENDING")
      .then((res) => res.json())
      .then((data) => setPendingOrders(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }

  useEffect(() => {
    fetchPendingOrders();
    window.addEventListener("pending-orders-changed", fetchPendingOrders);
    return () =>
      window.removeEventListener("pending-orders-changed", fetchPendingOrders);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isAdmin = session?.user?.role === "ADMIN";
  const userName = session?.user?.name || "Usuario";
  let userRole = session?.user?.role || "";
  if (userRole === "ADMIN") {
    userRole = "Administrador";
  } else if (userRole === "OPERATOR") {
    userRole = "Operador";
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border rounded-r-4xl bg-gray-100 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:w-72 2xl:w-80`}
    >
      <div className="flex items-center justify-between px-6 pt-6 pb-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-200">
            <Layers className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-gray-800">
              MiBuss
            </h1>
            <p className="text-xs text-gray-600">Panel administrativo</p>
          </div>
        </Link>
        <button
          onClick={close}
          className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div ref={profileRef} className="mx-4 mb-4">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-white hover:bg-gray-50 px-3 py-2 text-left transition-colors cursor-pointer"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={profileImage || undefined} />
            <AvatarFallback className="bg-gray-600">
              <User className="h-4 w-4 text-white" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-600 truncate">{userRole}</p>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-600 transition-transform duration-300 ${profileOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ${profileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            <div className="mt-1 p-1.5 space-y-2 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  close();
                  router.push("/perfil");
                }}
                className="flex w-full items-center gap-3 px-4 py-1.5 text-sm rounded-lg hover:bg-gray-200 text-gray-800 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <FaUser className="h-4 w-4 text-gray-600" />
                <span>Configurar perfil</span>
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
                className="flex w-full items-center gap-3 px-4 py-1.5 text-sm rounded-lg bg-red-500 hover:bg-red-600 transition-colors cursor-pointer text-white"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-gray-200 scrollbar-thumb-indigo-300 hover:scrollbar-thumb-indigo-400 px-3 mb-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Menú Principal
        </p>
        <ul className="space-y-1">
          {getMainMenu(isAdmin, pendingOrders).map((item) => {
            const isActive =
              item.href !== "#" && pathname.startsWith(item.href);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={close}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "text-gray-600 hover:bg-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge.count > 0 && (
                    <Badge
                      className={`${item.badge.bgColor} h-5 w-5 text-[10px]`}
                    >
                      <p className="pt-0.5">{item.badge.count}</p>
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
          Pagos
        </p>
        <ul className="space-y-1">
          {paymentMenu.map((item) => {
            const isActive =
              item.href !== "#" && pathname.startsWith(item.href);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={close}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "text-gray-600 hover:bg-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mx-4 mb-18 md:mb-6 rounded-xl bg-indigo-800 p-4">
        <div className="flex justify-start mb-2">
          <AiFillMessage className="h-8 w-8 text-white" />
        </div>
        <p className="mb-1 text-sm font-medium text-white">
          ¿Necesitas ayuda? genera un ticket y te contactaremos
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-2 w-full bg-white text-gray-900 hover:bg-white/90 cursor-pointer"
        >
          Generar ticket
        </Button>
      </div>
    </aside>
  );
}
