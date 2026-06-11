"use client";

import { useEffect, useState } from "react";
import {
  Map,
  MapRoute,
  MapMarker,
  MarkerContent,
  MapControls,
} from "@/components/ui/map";
import { Badge } from "./ui/badge";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatKm, formatTravelTime } from "@/lib/distance";
import { FaRoute } from "react-icons/fa";

interface Shipment {
  id: string;
  trackingNumber: string;
  category: string;
  origin: string;
  destination: string;
  weight: number;
  fee: number;
  status: string;
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
  distance: number | null;
}

export default function OnTheWayMap() {
  const [shipment, setShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    fetch("/api/shipments?status=IN_TRANSIT")
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) setShipment(data[0]);
      })
      .catch(() => {});
  }, []);

  if (!shipment) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">En camino</h3>
          <span className="text-sm text-gray-600">—</span>
        </div>
        <div className="flex h-65 items-center justify-center rounded-xl border border-border bg-white">
          <p className="text-sm text-gray-600">No hay envíos en tránsito</p>
        </div>
      </div>
    );
  }

  const hasCoords =
    shipment.originLat != null &&
    shipment.originLng != null &&
    shipment.destLat != null &&
    shipment.destLng != null;

  const center: [number, number] = hasCoords
    ? [
        (shipment.originLng! + shipment.destLng!) / 2,
        (shipment.originLat! + shipment.destLat!) / 2,
      ]
    : [-12.0464, -77.0428];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaRoute className="h-5 w-5 text-gray-900" />
          <h3 className="text-lg font-semibold text-gray-800">En camino</h3>
        </div>
        <Badge className="bg-green-600 text-sm text-white py-3 px-4">
          {shipment.trackingNumber}
        </Badge>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="h-70 w-full">
          <Map
            center={center}
            zoom={hasCoords ? 8 : 5}
            className="h-full w-full"
          >
            {hasCoords && (
              <>
                <MapRoute
                  coordinates={[
                    [shipment.originLng!, shipment.originLat!],
                    [shipment.destLng!, shipment.destLat!],
                  ]}
                  color="#00D100"
                  width={4}
                  opacity={0.7}
                  interactive={false}
                />
                <MapMarker
                  longitude={shipment.originLng!}
                  latitude={shipment.originLat!}
                >
                  <MarkerContent>
                    <div className="h-4 w-4 rounded-full border-2 border-white bg-green-600 shadow-lg" />
                  </MarkerContent>
                </MapMarker>
                <MapMarker
                  longitude={shipment.destLng!}
                  latitude={shipment.destLat!}
                >
                  <MarkerContent>
                    <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-lg" />
                  </MarkerContent>
                </MapMarker>
              </>
            )}
            <MapControls
              showZoom={true}
              showLocate={true}
              position="bottom-right"
            />
          </Map>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-4 rounded-xl border border-border bg-white p-4">
        <div className="text-center">
          <p className="text-xs md:text-sm text-gray-500">Categoría</p>
          <p className="mt-1 text-xs md:text-sm font-semibold text-gray-900">
            {CATEGORY_LABELS[shipment.category] || shipment.category}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs md:text-sm text-gray-500">Distancia</p>
          <p className="mt-1 text-xs md:text-sm font-semibold text-gray-900">
            {formatKm(shipment.distance)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs md:text-sm text-gray-500">Estimación</p>
          <p className="mt-1 text-xs md:text-sm font-semibold text-gray-900">
            {formatTravelTime(shipment.distance)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs md:text-sm text-gray-500">Peso</p>
          <p className="mt-1 text-xs md:text-sm font-semibold text-gray-900">
            {shipment.weight}kg
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs md:text-sm text-gray-500">Tarifa</p>
          <p className="mt-1 text-xs md:text-sm font-semibold text-gray-900">
            S/. {shipment.fee.toLocaleString("es-ES")}
          </p>
        </div>
      </div>
    </div>
  );
}
