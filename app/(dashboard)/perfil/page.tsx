"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar perfil");
        return res.json();
      })
      .then((data) => {
        if (data.name) setName(data.name);
        if (data.image) setImagePreview(data.image);
      })
      .catch(() => {
        sileo.error({
          title:
            "No se pudo cargar tu perfil. Intenta cerrar sesión y volver a iniciar.",
        });
      });
  }, []);

  let role = session?.user?.role || "";
  if (role === "ADMIN") role = "Administrador";
  else if (role === "OPERATOR") role = "Operador";

  function compressImage(
    dataUrl: string,
    maxW = 200,
    maxH = 200,
    quality = 0.7,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width,
          h = img.height;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      sileo.error({ title: "Selecciona una imagen válida" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      sileo.error({ title: "La imagen no debe superar 5MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const original = event.target?.result as string;
      try {
        const compressed = await compressImage(original);
        setImagePreview(compressed);
      } catch {
        sileo.error({ title: "Error al procesar la imagen" });
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (password && password !== confirmPassword) {
      sileo.error({ title: "Las contraseñas no coinciden" });
      setSaving(false);
      return;
    }
    try {
      const body: any = { name };
      if (password) body.password = password;
      if (imagePreview) body.image = imagePreview;
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar");
      }
      const updated = await res.json();
      await update({ name, id: updated.id });
      window.dispatchEvent(
        new CustomEvent("profile-image-changed", { detail: updated.image }),
      );
      sileo.success({ title: "Perfil actualizado" });
      setPassword("");
      setConfirmPassword("");
    } catch {
      sileo.error({ title: "Error al guardar el perfil" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-[#0F172A]">Configurar perfil</h2>

      <Card className="border-border px-2">
        <CardHeader>
          <CardTitle className="text-base">Información personal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative cursor-pointer overflow-hidden rounded-full ring-2 ring-border hover:ring-primary"
                style={{ width: 192, height: 192 }}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                    key={imagePreview}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? "Cambiar foto" : "Subir foto"}
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => {
                      setImagePreview("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Nombre completo
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Correo electrónico
                </label>
                <Input
                  value={session?.user?.email || ""}
                  disabled
                  className="bg-gray-50 text-[#64748B]"
                />
                <p className="mt-1 text-xs text-[#64748B]">
                  El correo no se puede modificar
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Rol
                </label>
                <Input
                  value={role}
                  disabled
                  className="bg-gray-50 text-[#64748B]"
                />
                <p className="mt-1 text-xs text-[#64748B]">
                  El rol no se puede modificar
                </p>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Nueva contraseña{" "}
                  <span className="font-normal text-[#64748B]">(opcional)</span>
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Escribe la nueva contraseña"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#0F172A]">
                  Repetir contraseña{" "}
                  <span className="font-normal text-[#64748B]">(opcional)</span>
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir la nueva contraseña"
                />
                {password &&
                  confirmPassword &&
                  password !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      Las contraseñas no coinciden
                    </p>
                  )}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={
                  saving || !name.trim() || password !== confirmPassword
                }
              >
                {saving ? "Guardando..." : "Guardar cambios"}
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
