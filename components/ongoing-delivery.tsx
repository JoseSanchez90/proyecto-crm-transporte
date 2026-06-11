"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { FaTruck } from "react-icons/fa";
import { formatKm } from "@/lib/distance";

interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  distance: number | null;
}

export default function OngoingDelivery() {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    fetch("/api/shipments?status=IN_TRANSIT")
      .then((res) => res.json())
      .then((data) => setShipments(data.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaTruck className="h-5 w-5 text-gray-900" />
          <h3 className="text-lg font-semibold text-gray-900">
            Envíos en curso
          </h3>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {shipments.length === 0 ? (
          <p className="text-sm text-gray-600 py-6 text-center">
            No hay envíos en curso
          </p>
        ) : (
          shipments.map((s, i) => (
            <Link key={s.id} href={`/envios/${s.id}`}>
              <Card className="cursor-pointer py-1">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {s.trackingNumber}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-600 truncate">
                        {s.origin}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      <span className="text-xs text-gray-600 truncate">
                        {s.destination}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{formatKm(s.distance)}</p>
                  </div>
                  <Image
                    src="/images/truck.webp"
                    alt="Truck"
                    width={200}
                    height={200}
                    className="rounded-full"
                  />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
