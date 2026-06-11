"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Weight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatKm } from "@/lib/distance";
import { FaBoxOpen, FaTruck } from "react-icons/fa";
import { GiWeight } from "react-icons/gi";

interface Shipment {
  id: string;
  trackingNumber: string;
  category: string;
  origin: string;
  destination: string;
  weight: number;
  fee: number;
  distance: number | null;
}

export default function TrackingList() {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    fetch("/api/shipments?status=IN_TRANSIT")
      .then((res) => res.json())
      .then((data) => setShipments(data))
      .catch(() => {});
  }, []);

  if (shipments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white py-12">
        <MapPin className="h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-500">
          No hay envíos en tránsito
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Envíos en tránsito ({shipments.length})
        </h3>
      </div>
      <div className="max-h-90 overflow-y-auto flex gap-2">
        {shipments.slice(0, 3).map((s) => (
          <Link key={s.id} href={`/envios/${s.id}`}>
            <div className="group rounded-xl border border-border bg-white p-4 hover:border hover:border-primary">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">
                      {s.trackingNumber}
                    </p>
                    <Badge className="bg-blue-600 text-xs">En tránsito</Badge>
                    {/* <span className="self-center flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 shrink-0">
                      Ver
                      <ArrowRight className="w-4 h-4" />
                    </span> */}
                  </div>
                  <div className="mt-2 flex flex-col items-start gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1 max-w-full">
                      <span className="h-3 w-3 shrink-0 rounded-full bg-green-600" />
                      <span className="truncate">{s.origin}</span>
                    </span>
                    <span className="flex items-center gap-1 max-w-full">
                      <span className="h-3 w-3 shrink-0 rounded-full bg-blue-500" />
                      <span className="truncate">{s.destination}</span>
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                      <span className="flex items-center gap-1">
                        <FaBoxOpen className="h-3 w-3" />
                        {CATEGORY_LABELS[s.category] || s.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <GiWeight className="h-3 w-3" />
                        {s.weight} kg
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                      <span className="flex items-center gap-1">
                        <FaTruck className="h-3 w-3" />
                        {formatKm(s.distance)}
                      </span>
                      <span className="font-bold text-gray-900">
                        S/. {s.fee.toLocaleString("es-ES")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
