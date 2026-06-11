"use client"

import { Map, MapRoute, MapMarker, MarkerContent } from "@/components/ui/map"

interface Props {
  originLat?: number | null
  originLng?: number | null
  destLat?: number | null
  destLng?: number | null
  originName: string
  destName: string
  className?: string
}

export default function ShipmentMap({ originLat, originLng, destLat, destLng, originName, destName, className }: Props) {
  const hasOrigin = originLat != null && originLng != null
  const hasDest = destLat != null && destLng != null

  if (!hasOrigin || !hasDest) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-gray-50">
        <p className="text-sm text-[#64748B]">Coordenadas no disponibles</p>
      </div>
    )
  }

  const center: [number, number] = [
    (originLng! + destLng!) / 2,
    (originLat! + destLat!) / 2,
  ]

  const coords: [number, number][] = [
    [originLng!, originLat!],
    [destLng!, destLat!],
  ]

  return (
    <div className={`h-full w-full overflow-hidden rounded-lg border border-border ${className || ""}`}>
      <Map center={center} zoom={10} className="h-full w-full">
        <MapRoute
          coordinates={coords}
          color="#3B82F6"
          width={3}
          opacity={0.7}
          interactive={false}
        />
        <MapMarker longitude={originLng!} latitude={originLat!}>
          <MarkerContent>
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-lg text-[10px] font-bold text-white">
              O
            </div>
          </MarkerContent>
        </MapMarker>
        <MapMarker longitude={destLng!} latitude={destLat!}>
          <MarkerContent>
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary shadow-lg text-[10px] font-bold text-white">
              D
            </div>
          </MarkerContent>
        </MapMarker>
      </Map>
    </div>
  )
}
