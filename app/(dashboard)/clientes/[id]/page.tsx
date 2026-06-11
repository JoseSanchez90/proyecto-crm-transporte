"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Package, Truck, Landmark, Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface Invoice {
  id: string;
  docType: string;
  docNumber: string;
  issueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  shipments: { shipment: { trackingNumber: string } }[];
}

interface Client {
  id: string;
  name: string;
  ruc?: string | null;
  email: string;
  phone: string;
  address: string;
  shipments: Shipment[];
  invoices: Invoice[];
}

interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: string;
  weight: number;
  fee: number;
  driver: { name: string } | null;
}

const statusMap: Record<
  string,
  {
    label: string;
    color:
      | "bg-green-600 text-white"
      | "bg-blue-600 text-white"
      | "bg-yellow-600 text-white"
      | "bg-red-600 text-white";
  }
> = {
  DELIVERED: { label: "Entregado", color: "bg-green-600 text-white" },
  IN_TRANSIT: { label: "En envío", color: "bg-blue-600 text-white" },
  PENDING: { label: "Pendiente", color: "bg-yellow-600 text-white" },
  CANCELLED: { label: "Cancelado", color: "bg-red-600 text-white" },
};

function parseAddress(full: string) {
  const parts = full.split(",").map((s) => s.trim());
  if (parts.length === 4) {
    return {
      address: parts[0],
      district: parts[1],
      province: parts[2],
      department: parts[3],
    };
  }
  if (parts.length === 3) {
    return {
      address: parts[0],
      district: "",
      province: parts[1],
      department: parts[2],
    };
  }
  return { address: full, district: "", province: "", department: "" };
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState({
    name: "",
    ruc: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    department: "",
    district: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((res) => res.json())
      .then((data: Client) => {
        setClient(data);
        const parsed = parseAddress(data.address);
        setForm({
          name: data.name,
          ruc: data.ruc || "",
          email: data.email,
          phone: data.phone,
          address: parsed.address,
          province: parsed.province,
          department: parsed.department,
          district: parsed.district,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const fullAddress = `${form.address}, ${form.district}, ${form.province}, ${form.department}`;
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, address: fullAddress }),
    });
    if (res.ok) {
      sileo.success({ title: "Cliente actualizado" });
      router.refresh();
    } else {
      sileo.error({ title: "Error al actualizar" });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-center text-[#64748B]">
        <div className="flex items-center gap-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-800" />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center text-[#EF4444]">
        Cliente no encontrado
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/clientes")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-[#0F172A]">{client.name}</h2>
      </div>

      {client.invoices && client.invoices.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Facturas de {client.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {client.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">
                      {inv.docNumber}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {inv.shipments.length} envío(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      S/. {inv.total.toLocaleString("es-ES")}
                    </p>
                    <Badge
                      className={
                        inv.status === "COBRADA"
                          ? "bg-green-500"
                          : inv.status === "ANULADA"
                            ? "bg-red-500"
                            : "bg-blue-500"
                      }
                    >
                      {inv.status === "COBRADA"
                        ? "Cobrada"
                        : inv.status === "ANULADA"
                          ? "Anulada"
                          : "Emitida"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 border-border">
          <CardHeader>
            <CardTitle className="text-base">Editar información</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Nombre
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  RUC
                </label>
                <Input
                  value={form.ruc}
                  onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                  placeholder="20123456789"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Email
                </label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Teléfono
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Dirección
                </label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#64748B]">
                  Departamento
                </label>
                <Select
                  value={form.department}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      department: v,
                      province: "",
                      district: "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
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
                  value={form.province}
                  onValueChange={(v) =>
                    setForm({ ...form, province: v, district: "" })
                  }
                  disabled={!form.department}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    {(form.department
                      ? peruProvinces[form.department]
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
                  value={form.district}
                  onValueChange={(v) => setForm({ ...form, district: v })}
                  disabled={!form.province}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar distrito" />
                  </SelectTrigger>
                  <SelectContent>
                    {(form.department && form.province
                      ? peruDistricts[form.department]?.[form.province] || []
                      : []
                    ).map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Actualizar Cliente"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Envíos de {client.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.shipments.length === 0 ? (
              <p className="text-sm text-[#64748B] py-4">
                Este cliente no tiene envíos registrados.
              </p>
            ) : (
              <div className="space-y-3">
                {client.shipments.map((s) => {
                  const st = statusMap[s.status] || {
                    label: s.status,
                    variant: "info" as const,
                  };
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A]">
                          {s.trackingNumber}
                        </p>
                        <p className="text-xs text-[#64748B] truncate">
                          {s.origin} → {s.destination}
                        </p>
                        {s.driver && (
                          <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                            <Truck className="h-3 w-3" />
                            {s.driver.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <Badge className={st.color}>{st.label}</Badge>
                        <p className="text-xs text-[#64748B] mt-1">
                          {s.weight}kg · ${s.fee.toLocaleString("es-ES")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
