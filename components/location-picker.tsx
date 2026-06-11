"use client"

import { useState, useEffect, useRef } from "react"
import { MapPin, Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Map, MapMarker, MarkerContent } from "@/components/ui/map"

interface Suggestion {
  display_name: string
  lat: string
  lon: string
}

async function nominatimSearch(q: string, signal: AbortSignal): Promise<Suggestion[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=pe&format=json&limit=5&accept-language=es`,
      {
        signal,
        headers: { "User-Agent": "FreightFlowCRM/1.0", "Accept-Language": "es" },
      }
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
      { headers: { "User-Agent": "FreightFlowCRM/1.0", "Accept-Language": "es" } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.display_name || null
  } catch {
    return null
  }
}

interface LocationPickerProps {
  value: {
    address: string
    lat: number | null
    lng: number | null
  }
  onChange: (data: { address: string; lat: number | null; lng: number | null }) => void
  placeholder?: string
}

export default function LocationPicker({ value, onChange, placeholder }: LocationPickerProps) {
  const [query, setQuery] = useState(value.address || "")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isFocusedRef = useRef(false)

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (abortRef.current) abortRef.current.abort()

    if (!query || query.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)

      try {
        let data = await nominatimSearch(query, controller.signal)

        if (!data || data.length === 0) {
          const stripped = query.replace(/^\d+\s*/, "").replace(/\s+\d+$/, "")
          if (stripped !== query) {
            data = await nominatimSearch(stripped, controller.signal)
          }
        }

        setSuggestions(data || [])
        if (data?.length > 0 && isFocusedRef.current) {
          setOpen(true)
        } else {
          setOpen(false)
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([])
          setOpen(false)
        }
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function selectSuggestion(s: Suggestion) {
    onChange({
      address: s.display_name,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon),
    })
    setQuery(s.display_name)
    setSuggestions([])
    setOpen(false)
  }

  async function handleMarkerDrag(lat: number, lng: number) {
    const displayName = await reverseGeocode(lat, lng)
    onChange({
      address: displayName || query,
      lat,
      lng,
    })
    if (displayName) setQuery(displayName)
  }

  function clearLocation() {
    onChange({ address: "", lat: null, lng: null })
    setQuery("")
    setSuggestions([])
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            const val = e.target.value
            setQuery(val)
            onChange({ address: val, lat: null, lng: null })
          }}
          onFocus={() => {
            isFocusedRef.current = true
            if (suggestions.length > 0) setOpen(true)
          }}
          onBlur={() => { isFocusedRef.current = false }}
          placeholder={placeholder || "Buscar dirección..."}
          className="pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {!loading && value.lat != null && (
          <button
            type="button"
            onClick={clearLocation}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {open && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover p-1 shadow-md"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectSuggestion(s)}
                className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {value.lat != null && value.lng != null && (
        <div className="h-[180px] w-full overflow-hidden rounded-lg border border-border">
          <Map
            center={[value.lng, value.lat]}
            zoom={15}
            className="h-full w-full"
            loading={false}
          >
            <MapMarker
              longitude={value.lng}
              latitude={value.lat}
              draggable={true}
              onDragEnd={(e) => handleMarkerDrag(e.lat, e.lng)}
            >
              <MarkerContent>
                <div className="h-5 w-5 rounded-full border-2 border-white bg-primary shadow-lg cursor-grab active:cursor-grabbing" />
              </MarkerContent>
            </MapMarker>
          </Map>
        </div>
      )}
    </div>
  )
}
