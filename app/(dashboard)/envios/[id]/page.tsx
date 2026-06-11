"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Pencil,
  Trash2,
  Play,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { FaBoxOpen, FaPhoneVolume } from "react-icons/fa6";
import { GiWeight } from "react-icons/gi";
import { FaRoute, FaTruck, FaUser, FaCalendarAlt } from "react-icons/fa";
import { IoMdMail } from "react-icons/io";
import { MdGpsFixed } from "react-icons/md";
import { sileo } from "sileo";
import dynamic from "next/dynamic";
import ConfirmDialog from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatKm, formatTravelTime } from "@/lib/distance";

const ShipmentMap = dynamic(() => import("@/components/shipment-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl border border-border bg-gray-50">
      <p className="text-sm text-[#64748B]">Cargando mapa...</p>
    </div>
  ),
});

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
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
  distance: number | null;
  createdAt: string;
  client: { id: string; name: string; email: string; phone: string };
  driver: { id: string; name: string; email: string; phone: string } | null;
  createdBy: { name: string; email: string };
  invoiceShipments: {
    invoice: { id: string; docNumber: string; docType: string };
  }[];
}

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    step: number;
  }
> = {
  PENDING: {
    label: "Pendiente",
    bg: "bg-gray-100",
    color: "text-gray-400",
    step: 0,
  },
  IN_TRANSIT: {
    label: "En tránsito",
    color: "text-blue-400",
    bg: "bg-blue-50",
    step: 1,
  },
  DELIVERED: {
    label: "Entregado",
    color: "text-green-400",
    bg: "bg-green-50",
    step: 2,
  },
  CANCELLED: {
    label: "Cancelado",
    color: "text-red-400",
    bg: "bg-red-50",
    step: -1,
  },
};

const nextStatuses: Record<
  string,
  {
    label: string;
    icon: any;
    status: string;
    color: string;
  }[]
> = {
  PENDING: [
    {
      label: "Iniciar envío",
      icon: Play,
      status: "IN_TRANSIT",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: "Cancelar",
      icon: Ban,
      status: "CANCELLED",
      color: "bg-red-600 hover:bg-red-700",
    },
  ],
  IN_TRANSIT: [
    {
      label: "Marcar entregado",
      icon: CheckCircle2,
      status: "DELIVERED",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      label: "Cancelar",
      icon: Ban,
      status: "CANCELLED",
      color: "bg-red-600 hover:bg-red-700",
    },
  ],
  DELIVERED: [],
  CANCELLED: [],
};

const steps = [
  { key: "PENDING", label: "Pendiente" },
  { key: "IN_TRANSIT", label: "En tránsito" },
  { key: "DELIVERED", label: "Entregado" },
];

function StatusTimeline({ current }: { current: string }) {
  const config = statusConfig[current];
  const isCancelled = current === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <Ban className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-700">Envío cancelado</p>
          <p className="text-xs text-red-500">
            Este envío fue cancelado y no continuará su proceso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white px-6 py-5">
      <div className="flex items-center w-full">
        {steps.map((step, i) => {
          const isActive = config.step >= i;
          const isCurrent = current === step.key;
          const isLast = i === steps.length - 1;

          return (
            <Fragment key={step.key}>
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "bg-gray-100 text-gray-400"
                  } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                >
                  {isActive ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </div>
                <p
                  className={`mt-1.5 text-xs font-medium whitespace-nowrap ${isActive ? "text-primary" : "text-gray-400"}`}
                >
                  {step.label}
                </p>
              </div>
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-3 -mt-4 rounded-full ${config.step > i ? "bg-primary" : "bg-gray-200"}`}
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | React.ReactNode;
  icon?: any;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <Icon className="h-4 w-4 text-gray-500" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 wrap-break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function parseAddress(full: string) {
  const parts = full.split(",").map((s) => s.trim());
  if (parts.length >= 3) {
    return {
      address: parts[0],
      province: parts[1],
      department: parts.slice(2).join(", "),
    };
  }
  return { address: full, province: "", department: "" };
}

export default function ShipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/shipments/${id}`)
      .then((res) => res.json())
      .then(setShipment)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    setChangingStatus(true);
    const res = await fetch(`/api/shipments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setShipment(updated);
      window.dispatchEvent(new CustomEvent("pending-orders-changed"));
    } else {
      sileo.error({ title: "Error al cambiar el estado" });
    }
    setChangingStatus(false);
  }

  async function handleDelete() {
    const res = await fetch(`/api/shipments/${id}`, { method: "DELETE" });
    if (res.ok) {
      sileo.success({ title: "Envío eliminado" });
      router.push("/envios");
      router.refresh();
    } else {
      sileo.error({ title: "Error al eliminar el envío" });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-gray-200" />
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-100" />
          </div>
          <div className="ml-auto flex gap-2">
            <div className="h-9 w-24 rounded-lg bg-gray-200" />
            <div className="h-9 w-20 rounded-lg bg-gray-200" />
          </div>
        </div>
        <div className="h-16 rounded-xl bg-gray-100" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-48 rounded-xl bg-gray-100" />
          <div className="h-48 rounded-xl bg-gray-100" />
        </div>
        <div className="h-10 rounded-lg bg-gray-100" />
        <div className="h-100 rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MapPin className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-lg font-medium text-gray-900">
          Envío no encontrado
        </p>
        <p className="mt-1 text-sm text-gray-500">
          El envío que buscas no existe o fue eliminado.
        </p>
        <Button className="mt-6" onClick={() => router.push("/envios")}>
          Volver a envíos
        </Button>
      </div>
    );
  }

  const st = statusConfig[shipment.status] || {
    label: shipment.status,
    variant: "info" as const,
    color: "#64748B",
    bg: "#F8FAFC",
    step: -1,
  };
  const nextActions = nextStatuses[shipment.status] || [];
  const originAddr = parseAddress(shipment.origin);
  const destAddr = parseAddress(shipment.destination);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/envios")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-[#0F172A]">
              {shipment.trackingNumber}
            </h2>
            <Badge
              className="text-sm px-3 py-1"
              style={{ backgroundColor: st.bg, color: st.color }}
            >
              {st.label}
            </Badge>
            {shipment.invoiceShipments?.[0] && (
              <Link href={`/ventas`}>
                <Badge className="bg-indigo-500 text-xs px-2 py-1 cursor-pointer hover:bg-indigo-600">
                  {shipment.invoiceShipments[0].invoice.docNumber}
                </Badge>
              </Link>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Creado el{" "}
            {new Date(shipment.createdAt).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {nextActions.map((action) => (
            <Button
              key={action.status}
              size="sm"
              className={`gap-2 ${action.color}`}
              onClick={() => handleStatusChange(action.status)}
              disabled={changingStatus}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
          <Link href={`/envios/${id}/editar`}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 gap-2">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-red-600 hover:text-red-600"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar envío"
        description="¿Estás seguro de eliminar este envío? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        destructive
      />

      <StatusTimeline current={shipment.status} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FaTruck className="h-5 w-5 text-primary" />
              Detalles del envío
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              label="Categoría"
              value={CATEGORY_LABELS[shipment.category] || shipment.category}
              icon={FaBoxOpen}
            />
            <InfoRow
              label="Peso"
              value={`${shipment.weight} kg`}
              icon={GiWeight}
            />
            <InfoRow
              label="Tarifa"
              value={`S/. ${shipment.fee.toLocaleString("es-ES")}`}
              icon={FaTruck}
            />
            <InfoRow
              label="Distancia"
              value={`${formatKm(shipment.distance)} · ${formatTravelTime(shipment.distance)}`}
              icon={FaRoute}
            />
            {shipment.estimatedArrival && (
              <InfoRow
                label="Llegada estimada"
                value={new Date(shipment.estimatedArrival).toLocaleDateString(
                  "es-ES",
                  { year: "numeric", month: "long", day: "numeric" },
                )}
                icon={FaCalendarAlt}
              />
            )}
            {shipment.driver && (
              <div className="border-t border-border pt-4 space-y-4">
                <InfoRow
                  label="Conductor"
                  value={shipment.driver.name}
                  icon={FaUser}
                />
                <InfoRow
                  label="Email"
                  value={shipment.driver.email}
                  icon={IoMdMail}
                />
                <InfoRow
                  label="Teléfono"
                  value={shipment.driver.phone}
                  icon={FaPhoneVolume}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FaUser className="h-4 w-4 text-primary" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <Link
                href={`/clientes/${shipment.client.id}`}
                className="block group"
              >
                <InfoRow
                  label="Nombre"
                  value={
                    <span className="font-semibold text-primary group-hover:underline">
                      {shipment.client.name}
                    </span>
                  }
                  icon={FaUser}
                />
              </Link>
              <InfoRow
                label="Email"
                value={shipment.client.email}
                icon={IoMdMail}
              />
              <InfoRow
                label="Teléfono"
                value={shipment.client.phone}
                icon={FaPhoneVolume}
              />
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <FaUser className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Creado por</p>
                  <p className="text-sm font-medium text-gray-900">
                    {shipment.createdBy.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {shipment.createdBy.email}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FaRoute className="h-4 w-4 text-primary" />
              Ruta del envío
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 rounded-full items-center justify-center bg-emerald-500">
                  <p className="text-white font-bold">O</p>
                </div>
                <span className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                  Origen
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-gray-900">
                {originAddr.address}
              </p>
              {(originAddr.province || originAddr.department) && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {originAddr.province}
                  {originAddr.province && originAddr.department ? ", " : ""}
                  {originAddr.department}
                </p>
              )}
              {shipment.originLat != null && shipment.originLng != null && (
                <p className="mt-1 text-xs text-gray-400">
                  {shipment.originLat.toFixed(4)},{" "}
                  {shipment.originLng.toFixed(4)}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 rounded-full items-center justify-center bg-primary">
                  <p className="text-white font-bold">D</p>
                </div>
                <span className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                  Destino
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-gray-900">
                {destAddr.address}
              </p>
              {(destAddr.province || destAddr.department) && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {destAddr.province}
                  {destAddr.province && destAddr.department ? ", " : ""}
                  {destAddr.department}
                </p>
              )}
              {shipment.destLat != null && shipment.destLng != null && (
                <p className="mt-1 text-xs text-gray-400">
                  {shipment.destLat.toFixed(4)}, {shipment.destLng.toFixed(4)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-100 w-full">
        <ShipmentMap
          originLat={shipment.originLat}
          originLng={shipment.originLng}
          destLat={shipment.destLat}
          destLng={shipment.destLng}
          originName={shipment.origin}
          destName={shipment.destination}
        />
      </div>
    </div>
  );
}
