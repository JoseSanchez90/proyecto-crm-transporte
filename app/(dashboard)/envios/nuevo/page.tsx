"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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

export default function NewShipmentPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/drivers").then((r) => r.json()),
    ]).then(([clientsData, driversData]) => {
      setClients(clientsData);
      setDrivers(driversData);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/shipments", {
      method: "POST",
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
      router.push("/envios");
      router.refresh();
    } else {
      sileo.error({ title: "Error al crear el envío" });
      setSaving(false);
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold text-[#0F172A]">Nuevo Envío</h2>

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
                {" "}
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
                {saving ? "Guardando..." : "Crear Envío"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
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
