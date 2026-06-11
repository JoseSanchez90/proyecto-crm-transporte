"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatKm } from "@/lib/distance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "@/components/pagination";
import { FaTruck } from "react-icons/fa";

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
  createdAt: string;
  client: { name: string } | null;
  driver: { name: string } | null;
  distance: number | null;
}

const statusMap: Record<string, { label: string; color: string }> = {
  DELIVERED: { label: "Entregado", color: "bg-green-500" },
  IN_TRANSIT: { label: "En envío", color: "bg-blue-500" },
  PENDING: { label: "Pendiente", color: "bg-yellow-500" },
  CANCELLED: { label: "Cancelado", color: "bg-red-500" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const PAGE_SIZE = 10;

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all")
        params.set("status", statusFilter);
      if (search) params.set("search", search);
      fetch(`/api/shipments?${params}`)
        .then((res) => res.json())
        .then((data) => setShipments(data))
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  const paginatedShipments = shipments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="w-full max-w-[calc(100vw-2rem)] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FaTruck className="h-8 w-8 text-gray-900 shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Envíos</h2>
            <p className="text-sm text-gray-600">
              Administra los envíos de los clientes
            </p>
          </div>
        </div>
        <Link href="/envios/nuevo">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nuevo Envío
          </Button>
        </Link>
      </div>

      <Card className="border-border max-w-5xl 2xl:max-w-full mx-auto">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Todos los envíos</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  className="h-9 w-full sm:w-56 pl-9"
                  value={search}
                  onChange={handleSearch}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-35">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="IN_TRANSIT">En envío</SelectItem>
                  <SelectItem value="DELIVERED">Entregado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader className="bg-gray-200">
                <TableRow>
                  <TableHead>ID SEGUIMIENTO</TableHead>
                  <TableHead>CLIENTE</TableHead>
                  <TableHead>CATEGORÍA</TableHead>
                  <TableHead>PESO</TableHead>
                  <TableHead>PROCEDENCIA</TableHead>
                  <TableHead>DESTINO</TableHead>
                  <TableHead>FECHA</TableHead>
                  <TableHead>TARIFA</TableHead>
                  <TableHead>DISTANCIA</TableHead>
                  <TableHead>ESTADO</TableHead>
                  <TableHead>ACCIÓN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : shipments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-gray-600 py-8"
                    >
                      No hay envíos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedShipments.map((s) => {
                    const st = statusMap[s.status] || {
                      label: s.status,
                      variant: "info" as const,
                    };
                    return (
                      <TableRow
                        key={s.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <TableCell className="font-medium text-gray-800">
                          {s.trackingNumber}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {s.client?.name || "—"}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {CATEGORY_LABELS[s.category] || s.category}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {s.weight}kg
                        </TableCell>
                        <TableCell className="text-gray-600 max-w-xs truncate">
                          {s.origin}
                        </TableCell>
                        <TableCell className="text-gray-600 max-w-xs truncate">
                          {s.destination}
                        </TableCell>
                        <TableCell className="text-gray-600 whitespace-nowrap">
                          {formatDate(s.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium text-gray-800">
                          S/. {s.fee.toLocaleString("es-ES")}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatKm(s.distance)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${st.color} text-xs`}>
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/envios/${s.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ver detalle"
                              className="h-7 w-7 text-indigo-600 hover:text-indigo-600 hover:bg-indigo-100 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={page}
            totalPages={Math.ceil(shipments.length / PAGE_SIZE)}
            total={shipments.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
