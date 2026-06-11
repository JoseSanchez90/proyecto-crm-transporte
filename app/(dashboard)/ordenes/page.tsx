"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Eye, Grip } from "lucide-react";
import Link from "next/link";
import {
  FaClock,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaBoxOpen,
  FaCalendarAlt,
  FaCalendar,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { sileo } from "sileo";
import { formatKm } from "@/lib/distance";
import { GiWeight } from "react-icons/gi";

interface Shipment {
  id: string;
  trackingNumber: string;
  category: string;
  origin: string;
  destination: string;
  weight: number;
  fee: number;
  status: string;
  createdAt: string;
  distance: number | null;
  client: { name: string; id: string } | null;
  driver: { name: string; id: string } | null;
}

const columns = [
  {
    key: "PENDING",
    label: "Pendiente",
    color: { text: "#D97706", border: "#F59E0B", bg: "#FFFBEB" },
    icon: <FaClock className="h-6 w-6" />,
  },
  {
    key: "IN_TRANSIT",
    label: "En tránsito",
    color: { text: "#2563EB", border: "#3B82F6", bg: "#EFF6FF" },
    icon: <FaTruck className="h-6 w-6" />,
  },
  {
    key: "DELIVERED",
    label: "Entregado",
    color: { text: "#16A34A", border: "#22C55E", bg: "#F0FDF4" },
    icon: <FaCheckCircle className="h-6 w-6" />,
  },
  {
    key: "CANCELLED",
    label: "Cancelado",
    color: { text: "#DC2626", border: "#EF4444", bg: "#FEF2F2" },
    icon: <FaTimesCircle className="h-6 w-6" />,
  },
];

function KanbanCard({ shipment }: { shipment: Shipment }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: shipment.id,
      data: { shipment },
    });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative rounded-lg border border-border bg-white p-3 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 break-all">
            {shipment.trackingNumber}
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            {shipment.client?.name || "—"}
          </p>
        </div>
        <Grip className="h-4 w-4 shrink-0 text-gray-600" />
      </div>
      <div className="mt-2 text-xs text-gray-600 truncate">
        <div className="flex items-center text-xs text-gray-600">
          <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
          {shipment.origin}
        </div>
        <div className="flex items-center text-xs text-gray-600 mt-1">
          <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
          {shipment.destination}
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex justify-center items-center gap-1 2xl:gap-4">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <FaTruck className="h-3 w-3" />
            {formatKm(shipment.distance)}
          </span>
          <p className="text-sm font-bold">-</p>
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <GiWeight className="h-3 w-3" />
            {shipment.weight}kg
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs font-bold text-gray-900">
          S/. {shipment.fee.toLocaleString("es-ES")}
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
        <FaCalendar className="h-3 w-3" />
        <span>
          {new Date(shipment.createdAt).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      <Link
        href={`/envios/${shipment.id}`}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2 top-2 mt-6"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 cursor-pointer hover:bg-blue-700 hover:text-white transition-colors"
        >
          <Eye className="h-3 w-3" />
        </Button>
      </Link>
    </div>
  );
}

const PER_PAGE = 4;

function KanbanColumn({
  column,
  shipments,
}: {
  column: (typeof columns)[0];
  shipments: Shipment[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? shipments : shipments.slice(0, PER_PAGE);
  const remaining = shipments.length - PER_PAGE;

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-75 flex-col gap-3 rounded-xl border border-border bg-white p-4 ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <div
        className="pl-3 rounded-lg p-2 flex gap-4 items-center"
        style={{
          borderLeftColor: column.color.border,
        }}
      >
        <div style={{ color: column.color.text }}>{column.icon}</div>
        <div className="w-full">
          <h3
            className="text-sm font-semibold"
            style={{ color: column.color.text }}
          >
            {column.label}
          </h3>
          <p className="text-xs" style={{ color: column.color.text }}>
            {shipments.length} órdenes
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {shipments.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-gray-600">
            Arrastra órdenes aquí
          </div>
        ) : (
          <>
            {shipments.slice(0, PER_PAGE).map((s) => (
              <KanbanCard key={s.id} shipment={s} />
            ))}
            <div
              className={`grid transition-all duration-300 ${
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden flex flex-col gap-3 min-h-0">
                {shipments.slice(PER_PAGE).map((s) => (
                  <KanbanCard key={s.id} shipment={s} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {remaining > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-center py-1"
        >
          {expanded ? "Ver menos" : `Ver ${remaining} más`}
        </button>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    fetch("/api/shipments")
      .then((res) => res.json())
      .then((data) => {
        setShipments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function getColumnShipments(key: string) {
    return shipments.filter((s) => s.status === key);
  }

  function handleDragStart(event: DragStartEvent) {
    const shipment = event.active.data.current?.shipment as
      | Shipment
      | undefined;
    if (shipment) setActiveShipment(shipment);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveShipment(null);
    const { active, over } = event;
    if (!over) return;

    const shipment = active.data.current?.shipment as Shipment;
    const newStatus = over.id as string;
    if (!shipment || shipment.status === newStatus) return;

    setShipments((prev) =>
      prev.map((s) => (s.id === shipment.id ? { ...s, status: newStatus } : s)),
    );

    try {
      const res = await fetch(`/api/shipments/${shipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Estado actualizado" });
      window.dispatchEvent(new CustomEvent("pending-orders-changed"));
    } catch {
      setShipments((prev) =>
        prev.map((s) =>
          s.id === shipment.id ? { ...s, status: shipment.status } : s,
        ),
      );
      sileo.error({ title: "Error al actualizar estado" });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[#0F172A]">Órdenes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div
              key={col.key}
              className="flex h-75 animate-pulse flex-col gap-3 rounded-xl border border-border bg-white p-4"
            >
              <div className="h-10 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FaBoxOpen className="h-8 w-8 text-gray-900 shrink-0" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Órdenes</h2>
          <p className="text-sm text-gray-600">
            Administra las órdenes del sistema
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <KanbanColumn
              key={col.key}
              column={col}
              shipments={getColumnShipments(col.key)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeShipment && (
            <div className="h-39 rounded-lg border border-border bg-white p-3 shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 break-all">
                    {activeShipment.trackingNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {activeShipment.client?.name || "—"}
                  </p>
                </div>
              </div>
              <div className="mt-1 flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                {activeShipment.origin}
              </div>
              <div className="mt-1 flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                {activeShipment.destination}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {activeShipment.weight}kg
                </span>
                <span className="text-xs font-medium text-gray-900">
                  S/. {activeShipment.fee.toLocaleString("es-ES")}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {formatKm(activeShipment.distance)}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
