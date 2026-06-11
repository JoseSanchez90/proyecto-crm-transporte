"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Map,
  MapRoute,
  MapMarker,
  MarkerContent,
  MapControls,
} from "@/components/ui/map";
import { ArrowRight } from "lucide-react";
import { formatKm, formatTravelTime } from "@/lib/distance";

interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
  distance: number | null;
}

export default function TrackingMap() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selected, setSelected] = useState<Shipment | null>(null);

  useEffect(() => {
    fetch("/api/shipments?status=IN_TRANSIT")
      .then((res) => res.json())
      .then((data) => {
        setShipments(data);
        if (data.length === 1) setSelected(data[0]);
      })
      .catch(() => {});
  }, []);

  const withCoords = shipments.filter(
    (s) =>
      s.originLat != null &&
      s.originLng != null &&
      s.destLat != null &&
      s.destLng != null,
  );

  const center: [number, number] =
    withCoords.length > 0
      ? [
          withCoords.reduce((a, s) => a + s.originLng! + s.destLng!, 0) /
            (withCoords.length * 2),
          withCoords.reduce((a, s) => a + s.originLat! + s.destLat!, 0) /
            (withCoords.length * 2),
        ]
      : [-12.0464, -77.0428];

  if (withCoords.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-border bg-gray-50">
        <p className="text-sm text-gray-500">
          No hay envíos en tránsito con coordenadas
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border">
      <Map
        center={center}
        zoom={withCoords.length > 1 ? 5 : 8}
        className="h-full w-full"
      >
        {withCoords.map((s) => (
          <div key={s.id}>
            <MapRoute
              coordinates={[
                [s.originLng!, s.originLat!],
                [s.destLng!, s.destLat!],
              ]}
              color="#3B82F6"
              width={3}
              opacity={0.5}
              interactive={false}
            />
            <MapMarker longitude={s.originLng!} latitude={s.originLat!}>
              <MarkerContent>
                <button
                  type="button"
                  onClick={() => setSelected(s)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-white border-2 border-white text-[10px] font-bold shadow-lg transition-transform hover:scale-110 ${
                    selected?.id === s.id
                      ? "bg-emerald-500 scale-110"
                      : "bg-emerald-500"
                  }`}
                >
                  O
                </button>
              </MarkerContent>
            </MapMarker>
            <MapMarker longitude={s.destLng!} latitude={s.destLat!}>
              <MarkerContent>
                <button
                  type="button"
                  onClick={() => setSelected(s)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-white border-2 border-white text-[10px] font-bold shadow-lg transition-transform hover:scale-110 ${
                    selected?.id === s.id
                      ? "bg-primary scale-110"
                      : "bg-primary"
                  }`}
                >
                  D
                </button>
              </MarkerContent>
            </MapMarker>
          </div>
        ))}
        <MapControls showZoom showLocate position="bottom-right" />
      </Map>

      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-md">
          <Link href={`/envios/${selected.id}`}>
            <div className="rounded-xl border border-border bg-white p-4 shadow-lg transition-shadow hover:shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">
                  {selected.trackingNumber}
                </p>
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white">
                  En tránsito
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span className="truncate">{selected.origin}</span>
                <span>→</span>
                <span className="truncate">{selected.destination}</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {formatKm(selected.distance)} · {formatTravelTime(selected.distance)}
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-xs text-primary font-medium">
                Ver detalle
                <ArrowRight className="h-4 w-4" />
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
