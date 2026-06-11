"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { sileo } from "sileo";
import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatsCards from "@/components/stats-cards";
import OngoingDelivery from "@/components/ongoing-delivery";
import TrackingTable from "@/components/tracking-table";
import { FaChartPie } from "react-icons/fa";

const OnTheWayMap = dynamic(() => import("@/components/on-the-way-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-65 items-center justify-center rounded-xl border border-border bg-white">
      <p className="text-sm text-gray-600">Cargando mapa...</p>
    </div>
  ),
});

const TrackingMap = dynamic(() => import("@/components/tracking-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl border border-border bg-white">
      <p className="text-sm text-gray-600">Cargando mapa...</p>
    </div>
  ),
});

const TrackingList = dynamic(() => import("@/components/tracking-list"), {
  ssr: false,
  loading: () => <div className="h-48 animate-pulse rounded-xl bg-gray-100" />,
});

export default function DashboardPage() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.name && sessionStorage.getItem("welcome")) {
      sessionStorage.removeItem("welcome");
      const firstName = session.user.name.split(" ")[0];
      sileo.success({ title: `Bienvenido ${firstName}` });
    }
  }, [session]);

  return (
    <Tabs
      defaultValue="resumen"
      className="w-full max-w-[calc(100vw-2rem)] space-y-2"
    >
      <div className="flex items-center gap-3">
        <FaChartPie className="h-8 w-8 text-gray-900 shrink-0" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-600">
            Aquí puedes ver el resumen de tus envíos y el seguimiento de tus
            clientes
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-3">
          <Select defaultValue="semana">
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mes</SelectItem>
                <SelectItem value="año">Año</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Link href="/envios/nuevo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Envío
            </Button>
          </Link>
        </div>
      </div>

      <TabsContent value="resumen" className="space-y-6 mt-0">
        <StatsCards />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <OngoingDelivery />
          </div>
          <div className="lg:col-span-3">
            <OnTheWayMap />
          </div>
        </div>
        <TrackingTable />
      </TabsContent>

      <TabsContent value="seguimiento" className="space-y-6 mt-0">
        <div className="h-125 w-full">
          <TrackingMap />
        </div>
        <TrackingList />
      </TabsContent>
    </Tabs>
  );
}
