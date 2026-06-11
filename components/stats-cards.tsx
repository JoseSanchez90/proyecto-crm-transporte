"use client";

import { useEffect, useState } from "react";
import { Truck, Package, CircleCheckBig, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FaCircleCheck } from "react-icons/fa6";
import { PiChartLineUpBold } from "react-icons/pi";
import { FaBoxOpen, FaTruck } from "react-icons/fa";

interface Stats {
  totalShipments: number;
  pending: number;
  inTransit: number;
  totalRevenue: number;
  delivered: number;
  revenueChange: number;
  deliveredChange: number;
  totalDrivers: number;
  activeDrivers: number;
}

const statsConfig = [
  { label: "Total de Envíos", key: "totalShipments" as const, icon: FaBoxOpen },
  { label: "En tránsito", key: "inTransit" as const, icon: FaTruck },
  {
    label: "Ingresos",
    key: "totalRevenue" as const,
    icon: PiChartLineUpBold,
    format: (v: number) => `S/. ${v.toLocaleString("es-ES")}`,
    changeKey: "revenueChange" as const,
    changeLabel: "vs mes anterior",
  },
  {
    label: "Entregados",
    key: "delivered" as const,
    icon: FaCircleCheck,
    changeKey: "deliveredChange" as const,
    changeLabel: "vs mes anterior",
  },
];

export default function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    totalShipments: 0,
    pending: 0,
    inTransit: 0,
    totalRevenue: 0,
    delivered: 0,
    revenueChange: 0,
    deliveredChange: 0,
    totalDrivers: 0,
    activeDrivers: 0,
  });

  useEffect(() => {
    fetch("/api/shipments/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.totalShipments === "number") setStats(data);
      })
      .catch(() => {});
  }, []);

  function formatValue(key: string, value: number) {
    const config = statsConfig.find((s) => s.key === key);
    if (config?.format) return config.format(value);
    return value.toLocaleString("es-ES");
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat) => {
        const value = stats[stat.key];
        const changeKey = (stat as any).changeKey as keyof Stats | undefined;
        const change = changeKey ? stats[changeKey] : undefined;

        return (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {formatValue(stat.key, value)}
                  </p>
                  {change !== undefined && (
                    <p className="mt-1 text-xs">
                      <span
                        className={`font-medium ${change >= 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {change >= 0 ? "+" : ""}
                        {change}% {change >= 0 ? "↑" : "↓"}
                      </span>
                      <span className="ml-1 text-gray-600">
                        {(stat as any).changeLabel}
                      </span>
                    </p>
                  )}
                </div>
                <stat.icon className="h-12 w-12 text-primary" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
