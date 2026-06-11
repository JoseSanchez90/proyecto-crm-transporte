"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewDriverPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    dni: "",
    email: "",
    phone: "",
    license: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push("/conductores");
      router.refresh();
    } else {
      const data = await res.json();
      sileo.error({ title: data.error || "Error al crear conductor" });
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-[#0F172A]">Nuevo Conductor</h2>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Información del conductor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Nombre completo
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
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
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Teléfono
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  placeholder="+51 999 999 999"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Licencia
                </label>
                <Input
                  value={form.license}
                  onChange={(e) =>
                    setForm({ ...form, license: e.target.value })
                  }
                  required
                  placeholder="LIC-XXX"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar Conductor"}
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
