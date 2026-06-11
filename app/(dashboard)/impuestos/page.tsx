"use client";

import { useEffect, useState } from "react";
import { Search, Landmark, CheckCircle, Clock, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PiNoteFill } from "react-icons/pi";
import { FaCheck, FaClock } from "react-icons/fa";
import { sileo } from "sileo";
import Pagination from "@/components/pagination";

interface DetraccionRow {
  id: string;
  trackingNumber: string;
  client: string;
  fee: number;
  detraccion: number;
  neto: number;
  status: string;
  deposited: boolean;
  createdAt: string;
}

interface Summary {
  totalDetraccion: number;
  totalDeposited: number;
  totalPending: number;
  depositedCount: number;
  pendingCount: number;
  totalShipments: number;
  rate: number;
}

const months = [
  { value: "all", label: "Todos" },
  { value: "0", label: "Enero" },
  { value: "1", label: "Febrero" },
  { value: "2", label: "Marzo" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Mayo" },
  { value: "5", label: "Junio" },
  { value: "6", label: "Julio" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Septiembre" },
  { value: "9", label: "Octubre" },
  { value: "10", label: "Noviembre" },
  { value: "11", label: "Diciembre" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

const PAGE_SIZE = 10;

export default function DetraccionesPage() {
  const [rows, setRows] = useState<DetraccionRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ year });
    if (month && month !== "all") params.set("month", month);
    fetch(`/api/detracciones?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.rows)) {
          setRows(data.rows);
          setSummary(data.summary);
        }
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  const filtered = search
    ? rows.filter(
        (r) =>
          r.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
          r.client.toLowerCase().includes(search.toLowerCase()),
      )
    : rows;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function formatCurrency(n: number) {
    return `S/. ${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function recalcSummary(updatedRows: DetraccionRow[]) {
    let totalDetraccion = 0,
      totalDeposited = 0,
      totalPending = 0;
    let depositedCount = 0,
      pendingCount = 0;
    for (const r of updatedRows) {
      totalDetraccion += r.detraccion;
      if (r.deposited) {
        totalDeposited += r.detraccion;
        depositedCount++;
      } else {
        totalPending += r.detraccion;
        pendingCount++;
      }
    }
    setSummary({
      totalDetraccion: Math.round(totalDetraccion * 100) / 100,
      totalDeposited: Math.round(totalDeposited * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      depositedCount,
      pendingCount,
      totalShipments: updatedRows.length,
      rate: 0.04,
    });
  }

  return (
    <div className="w-full max-w-[calc(100vw-2rem)] space-y-6">
      <div className="flex items-center">
        <div className="flex items-center gap-3">
          <PiNoteFill className="h-8 w-8 text-gray-900" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Impuestos y Detracciones
            </h2>
            <p className="text-sm text-gray-600">
              Administra los impuestos del sistema
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary && (
          <>
            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Detracciones</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.totalDetraccion)}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {summary.totalShipments} envíos
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <Landmark className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Depositado</p>
                    <p className="mt-1 text-2xl font-bold text-green-600">
                      {formatCurrency(summary.totalDeposited)}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {summary.depositedCount} envíos
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500">
                    <FaCheck className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendiente</p>
                    <p className="mt-1 text-2xl font-bold text-yellow-500">
                      {formatCurrency(summary.totalPending)}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {summary.pendingCount} envíos
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500">
                    <FaClock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tasa aplicada</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {(summary.rate * 100).toFixed(0)}%
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Transporte de bienes
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-600">
                    <Percent className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Detalle por envío</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <Input
                  placeholder="Buscar..."
                  className="h-9 w-full sm:w-56 pl-9"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={month}
                onValueChange={(v) => {
                  setMonth(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-35">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={year}
                onValueChange={(v) => {
                  setYear(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-25">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
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
                  <TableHead>TRACKING</TableHead>
                  <TableHead>CLIENTE</TableHead>
                  <TableHead>TARIFA</TableHead>
                  <TableHead>DETRACCIÓN (4%)</TableHead>
                  <TableHead>NETO A COBRAR</TableHead>
                  <TableHead>ESTADO</TableHead>
                  <TableHead>FECHA</TableHead>
                  <TableHead className="w-24">ACCIÓN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-gray-600 py-8"
                    >
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-gray-600 py-8"
                    >
                      No hay envíos en este período
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((r) => (
                    <TableRow
                      key={r.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">
                        {r.trackingNumber}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {r.client}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {formatCurrency(r.fee)}
                      </TableCell>
                      <TableCell className="text-red-500 font-medium">
                        -{formatCurrency(r.detraccion)}
                      </TableCell>
                      <TableCell className="text-gray-900 font-medium">
                        {formatCurrency(r.neto)}
                      </TableCell>
                      <TableCell>
                        {r.deposited ? (
                          <Badge className="bg-green-500 text-xs py-3">
                            <FaCheck className="h-3 w-3 mr-1" />
                            Depositado
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500 text-xs py-3">
                            <FaClock className="h-3 w-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {new Date(r.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          className={`h-7 text-xs cursor-pointer ${
                            r.deposited
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
                          }`}
                          onClick={async () => {
                            const res = await fetch(`/api/shipments/${r.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                detraccionDeposited: !r.deposited,
                              }),
                            });
                            if (res.ok) {
                              sileo.success({
                                title: r.deposited
                                  ? "Desmarcado como depositado"
                                  : "Marcado como depositado",
                              });
                              const updated = rows.map((x) =>
                                x.id === r.id
                                  ? { ...x, deposited: !x.deposited }
                                  : x,
                              );
                              setRows(updated);
                              recalcSummary(updated);
                            } else {
                              sileo.error({ title: "Error al actualizar" });
                            }
                          }}
                        >
                          {r.deposited ? "Desmarcar" : "Depositar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={page}
            totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
