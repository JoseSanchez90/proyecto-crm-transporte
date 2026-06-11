"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  peruvianDepartments,
  peruProvinces,
  peruDistricts,
} from "@/lib/peru-data";

const LocationPicker = dynamic(() => import("@/components/location-picker"), {
  ssr: false,
});

interface Client {
  id: string;
  name: string;
}

interface Driver {
  id: string;
  name: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  category: string;
  origin: string;
  destination: string;
  weight: number;
  fee: number;
  status: string;
  estimatedArrival: string | null;
  clientId: string;
  driverId: string | null;
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
}

function parseAddress(full: string) {
  const parts = full.split(",").map((s) => s.trim());
  if (parts.length === 4) {
    return { address: parts[0], district: parts[1], province: parts[2], department: parts[3] };
  }
  if (parts.length === 3) {
    return { address: parts[0], district: "", province: parts[1], department: parts[2] };
  }
  return { address: full, district: "", province: "", department: "" };
}

export default function EditShipmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [clients, setClients] = useState<Client[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    trackingNumber: "",
    category: "",
    clientId: "",
    driverId: "",
    weight: "",
    fee: "",
    estimatedArrival: "",
    originAddress: "",
    originProvince: "",
    originDepartment: "",
    originDistrict: "",
    originLat: null as number | null,
    originLng: null as number | null,
    destAddress: "",
    destProvince: "",
    destDepartment: "",
    destDistrict: "",
    destLat: null as number | null,
    destLng: null as number | null,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/shipments/${id}`).then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/drivers").then((r) => r.json()),
    ]).then(([shipment, clientsData, driversData]) => {
      setClients(clientsData);
      setDrivers(driversData);
      const origin = parseAddress(shipment.origin);
      const dest = parseAddress(shipment.destination);
      setForm({
        trackingNumber: shipment.trackingNumber,
        category: shipment.category,
        clientId: shipment.clientId,
        driverId: shipment.driverId || "",
        weight: String(shipment.weight),
        fee: String(shipment.fee),
        estimatedArrival: shipment.estimatedArrival
          ? shipment.estimatedArrival.slice(0, 10)
          : "",
        originAddress: origin.address,
        originProvince: origin.province,
        originDepartment: origin.department,
        originDistrict: origin.district,
        originLat: shipment.originLat,
        originLng: shipment.originLng,
        destAddress: dest.address,
        destProvince: dest.province,
        destDepartment: dest.department,
        destDistrict: dest.district,
        destLat: shipment.destLat,
        destLng: shipment.destLng,
      });
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch(`/api/shipments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingNumber: form.trackingNumber,
        category: form.category,
        origin: form.originAddress,
        destination: form.destAddress,
        originProvince: form.originProvince || undefined,
        originDepartment: form.originDepartment || undefined,
        originDistrict: form.originDistrict || undefined,
        destProvince: form.destProvince || undefined,
        destDepartment: form.destDepartment || undefined,
        destDistrict: form.destDistrict || undefined,
        originLat: form.originLat,
        originLng: form.originLng,
        destLat: form.destLat,
        destLng: form.destLng,
        weight: form.weight,
        fee: form.fee,
        clientId: form.clientId,
        driverId: form.driverId || undefined,
        estimatedArrival: form.estimatedArrival,
      }),
    });

    if (res.ok) {
      router.push(`/envios/${id}`);
      router.refresh();
    } else {
      sileo.error({ title: "Error al actualizar el envío" });
      setSaving(false);
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return <div className="text-center text-[#64748B] py-12">Cargando...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/envios/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-[#0F172A]">Editar Envío</h2>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Información del envío</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3">
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Número de seguimiento
                </label>
                <Input
                  value={form.trackingNumber}
                  onChange={(e) =>
                    updateField("trackingNumber", e.target.value)
                  }
                  placeholder="#001234ABCD"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Categoría
                </label>
                <Select
                  value={form.category}
                  onValueChange={(v) => updateField("category", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ELECTRONICA">Electrónica</SelectItem>
                    <SelectItem value="MOBILIARIO">Mobiliario</SelectItem>
                    <SelectItem value="ROPA">Ropa</SelectItem>
                    <SelectItem value="ALIMENTOS">Alimentos</SelectItem>
                    <SelectItem value="MAQUINARIA">Maquinaria</SelectItem>
                    <SelectItem value="OTROS">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Cliente
                </label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => updateField("clientId", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Conductor
                </label>
                <Select
                  value={form.driverId}
                  onValueChange={(v) => updateField("driverId", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#0F172A]">
                Origen
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#64748B]">
                    Departamento
                  </label>
                  <Select
                    value={form.originDepartment}
                    onValueChange={(v) => {
                      updateField("originDepartment", v);
                      updateField("originProvince", "");
                      updateField("originDistrict", "");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {peruvianDepartments.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#64748B]">
                    Provincia
                  </label>
                  <Select
                    value={form.originProvince}
                    onValueChange={(v) => {
                      updateField("originProvince", v);
                      updateField("originDistrict", "");
                    }}
                    disabled={!form.originDepartment}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {(form.originDepartment
                        ? peruProvinces[form.originDepartment]
                        : []
                      ).map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#64748B]">
                    Distrito
                  </label>
                  <Select
                    value={form.originDistrict}
                    onValueChange={(v) => updateField("originDistrict", v)}
                    disabled={!form.originProvince}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar distrito" />
                    </SelectTrigger>
                    <SelectContent>
                      {(form.originDepartment && form.originProvince
                        ? peruDistricts[form.originDepartment]?.[
                            form.originProvince
                          ] || []
                        : []
                      ).map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <label className="mb-1 block text-sm font-medium text-[#64748B]">
                    Dirección
                  </label>
                  <LocationPicker
                    value={{
                      address: form.originAddress,
                      lat: form.originLat,
                      lng: form.originLng,
                    }}
                    onChange={(data) => {
                      updateField("originAddress", data.address);
                      setForm((prev) => ({
                        ...prev,
                        originLat: data.lat,
                        originLng: data.lng,
                      }));
                    }}
                    placeholder="Buscar dirección de origen..."
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#0F172A]">
                Destino
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#64748B]">
                    Departamento
                  </label>
                  <Select
                    value={form.destDepartment}
                    onValueChange={(v) => {
                      updateField("destDepartment", v);
                      updateField("destProvince", "");
                      updateField("destDistrict", "");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {peruvianDepartments.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#64748B]">
                    Provincia
                  </label>
                  <Select
                    value={form.destProvince}
                    onValueChange={(v) => {
                      updateField("destProvince", v);
                      updateField("destDistrict", "");
                    }}
                    disabled={!form.destDepartment}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {(form.destDepartment
                        ? peruProvinces[form.destDepartment]
                        : []
                      ).map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#64748B]">
                    Distrito
                  </label>
                  <Select
                    value={form.destDistrict}
                    onValueChange={(v) => updateField("destDistrict", v)}
                    disabled={!form.destProvince}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar distrito" />
                    </SelectTrigger>
                    <SelectContent>
                      {(form.destDepartment && form.destProvince
                        ? peruDistricts[form.destDepartment]?.[
                            form.destProvince
                          ] || []
                        : []
                      ).map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <label className="mb-1 block text-sm font-medium text-[#64748B]">
                    Dirección
                  </label>
                  <LocationPicker
                    value={{
                      address: form.destAddress,
                      lat: form.destLat,
                      lng: form.destLng,
                    }}
                    onChange={(data) => {
                      updateField("destAddress", data.address);
                      setForm((prev) => ({
                        ...prev,
                        destLat: data.lat,
                        destLng: data.lng,
                      }));
                    }}
                    placeholder="Buscar dirección de destino..."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Peso (kg)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Tarifa (S/)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.fee}
                  onChange={(e) => updateField("fee", e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Fecha estimada de llegada
                </label>
                <Input
                  type="date"
                  value={form.estimatedArrival}
                  onChange={(e) =>
                    updateField("estimatedArrival", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/envios/${id}`)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
