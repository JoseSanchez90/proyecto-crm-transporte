"use client";

import { useEffect, useState } from "react";
import { Package, Search, Filter, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatKm } from "@/lib/distance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaBoxOpen } from "react-icons/fa";

interface Shipment {
  id: string;
  trackingNumber: string;
  category: string;
  origin: string;
  destination: string;
  weight: number;
  fee: number;
  status: string;
  distance: number | null;
}

const statusMap: Record<string, { label: string; color: string }> = {
  DELIVERED: { label: "Entregado", color: "bg-green-600" },
  IN_TRANSIT: { label: "En envío", color: "bg-blue-500" },
  PENDING: { label: "Pendiente", color: "bg-yellow-500" },
  CANCELLED: { label: "Cancelado", color: "bg-red-500" },
};

export default function TrackingTable() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/shipments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setShipments(data);
      })
      .catch(() => {});
  }, []);

  const filtered = search
    ? shipments.filter(
        (s) =>
          s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
          s.origin.toLowerCase().includes(search.toLowerCase()) ||
          s.destination.toLowerCase().includes(search.toLowerCase()),
      )
    : shipments;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaBoxOpen className="h-5 w-5 text-gray-900" />
          <h3 className="text-lg font-semibold text-gray-900">
            Seguimiento de Órdenes
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/envios">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 cursor-pointer"
            >
              Ver más
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader className="bg-gray-200">
            <TableRow>
              <TableHead>ID DE ORDEN</TableHead>
              <TableHead>CATEGORÍA</TableHead>
              <TableHead>DISTANCIA</TableHead>
              <TableHead>PESO</TableHead>
              <TableHead>ORIGEN</TableHead>
              <TableHead>DESTINO</TableHead>
              <TableHead>TARIFA</TableHead>
              <TableHead>ESTADO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-gray-600 py-8"
                >
                  No hay envíos registrados
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice(0, 5).map((s) => {
                const st = statusMap[s.status] || {
                  label: s.status,
                  variant: "info" as const,
                };
                return (
                  <TableRow
                    key={s.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/envios/${s.id}`)}
                  >
                    <TableCell className="font-medium text-gray-900">
                      {s.trackingNumber}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {CATEGORY_LABELS[s.category] || s.category}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatKm(s.distance)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {s.weight}kg
                    </TableCell>
                    <TableCell
                      className="max-w-50 truncate text-gray-600"
                      title={`${s.origin}`}
                    >
                      {s.origin}
                    </TableCell>
                    <TableCell
                      className="max-w-50 truncate text-gray-600"
                      title={`${s.destination}`}
                    >
                      {s.destination}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      S/. {s.fee.toLocaleString("es-ES")}
                    </TableCell>
                    <TableCell>
                      <Badge className={st.color}>{st.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
