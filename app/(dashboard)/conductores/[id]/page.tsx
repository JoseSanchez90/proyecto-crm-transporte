"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: string;
  weight: number;
  fee: number;
  client: { name: string } | null;
}

interface Driver {
  id: string;
  name: string;
  dni?: string | null;
  email: string;
  phone: string;
  license: string;
  shipments: Shipment[];
}

const statusMap: Record<string, { label: string; color: string }> = {
  DELIVERED: { label: "Entregado", color: "bg-green-600 text-white" },
  IN_TRANSIT: { label: "En envío", color: "bg-blue-600 text-white" },
  PENDING: { label: "Pendiente", color: "bg-yellow-600 text-white" },
  CANCELLED: { label: "Cancelado", color: "bg-red-600 text-white" },
};

export default function EditDriverPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [driver, setDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState({
    name: "",
    dni: "",
    email: "",
    phone: "",
    license: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/drivers/${id}`)
      .then((res) => res.json())
      .then((data: Driver) => {
        setDriver(data);
        setForm({
          name: data.name,
          dni: data.dni || "",
          email: data.email,
          phone: data.phone,
          license: data.license,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/drivers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    router.refresh();
  }

  if (loading) {
    return <div className="text-center text-[#64748B] py-12">Cargando...</div>;
  }

  if (!driver) {
    return (
      <div className="text-center text-[#EF4444] py-12">
        Conductor no encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/conductores")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-[#0F172A]">{driver.name}</h2>
      </div>

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
                  DNI
                </label>
                <Input
                  value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value })}
                  placeholder="12345678"
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
                  Licencia
                </label>
                <Input
                  value={form.license}
                  onChange={(e) =>
                    setForm({ ...form, license: e.target.value })
                  }
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Actualizar Conductor"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Envíos de {driver.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driver.shipments.length === 0 ? (
              <p className="text-sm text-[#64748B] py-4">
                Este conductor no tiene envíos asignados.
              </p>
            ) : (
              <div className="space-y-3">
                {driver.shipments.map((s) => {
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
                        {s.client && (
                          <p className="text-xs text-[#64748B] mt-0.5">
                            {s.client.name}
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
