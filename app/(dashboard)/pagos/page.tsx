"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Fuel,
  Receipt,
  Wrench,
  UtensilsCrossed,
  Shield,
  Package,
  ArrowRight,
  Loader2,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sileo } from "sileo";
import { BsFillCreditCardFill, BsFillFuelPumpFill } from "react-icons/bs";
import { IoMdTrash } from "react-icons/io";
import {
  FaBoxOpen,
  FaMoneyBill,
  FaShieldAlt,
  FaUtensils,
} from "react-icons/fa";
import { PiChartLineDownBold, PiChartLineUpBold } from "react-icons/pi";
import { FaChartSimple, FaScrewdriverWrench } from "react-icons/fa6";
import { Textarea } from "@/components/ui/textarea";
import Pagination from "@/components/pagination";

interface TripCost {
  id: string;
  shipmentId: string;
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

interface ShipmentRow {
  id: string;
  trackingNumber: string;
  client: string;
  driver: string | null;
  fee: number;
  totalCost: number;
  netProfit: number;
  margin: number;
  costs: TripCost[];
  status: string;
  createdAt: string;
}

interface Summary {
  totalIncome: number;
  totalCosts: number;
  netProfit: number;
  margin: number;
  shipmentCount: number;
  shipmentsWithCosts: number;
}

const categoryMeta: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  FUEL: {
    label: "Combustible",
    icon: BsFillFuelPumpFill,
    color: "text-green-600 bg-green-100",
  },
  TOLL: {
    label: "Peajes",
    icon: FaMoneyBill,
    color: "text-yellow-600 bg-yellow-100",
  },
  MAINTENANCE: {
    label: "Mantenimiento",
    icon: FaScrewdriverWrench,
    color: "text-orange-600 bg-orange-100",
  },
  PER_DIEM: {
    label: "Viáticos",
    icon: FaUtensils,
    color: "text-blue-600 bg-blue-100",
  },
  INSURANCE: {
    label: "Seguro",
    icon: FaShieldAlt,
    color: "text-purple-600 bg-purple-100",
  },
  OTHER: {
    label: "Otros",
    icon: FaBoxOpen,
    color: "text-gray-600 bg-gray-100",
  },
};

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

function formatCurrency(n: number) {
  return `S/. ${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

const PAGE_SIZE = 10;

export default function PagosPage() {
  const [rows, setRows] = useState<ShipmentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRow | null>(
    null,
  );
  const [costs, setCosts] = useState<TripCost[]>([]);
  const [newCategory, setNewCategory] = useState("FUEL");
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [saving, setSaving] = useState(false);

  function fetchData() {
    setLoading(true);
    const params = new URLSearchParams({ year });
    if (month && month !== "all") params.set("month", month);
    if (search) params.set("search", search);
    fetch(`/api/trip-costs?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.rows)) {
          setRows(data.rows);
          setSummary(data.summary);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
  }, [year, month]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  function recalcSummary(updatedRows: ShipmentRow[]) {
    const totalIncome = updatedRows.reduce((s, r) => s + r.fee, 0);
    const totalCosts = updatedRows.reduce((s, r) => s + r.totalCost, 0);
    const netProfit = updatedRows.reduce((s, r) => s + r.netProfit, 0);
    setSummary({
      totalIncome,
      totalCosts,
      netProfit,
      margin: totalIncome > 0 ? netProfit / totalIncome : 0,
      shipmentCount: updatedRows.length,
      shipmentsWithCosts: updatedRows.filter((r) => r.costs.length > 0).length,
    });
  }

  function updateRowCosts(shipmentId: string, updatedCosts: TripCost[]) {
    setRows((prev) => {
      const next = prev.map((s) => {
        if (s.id !== shipmentId) return s;
        const totalCost = updatedCosts.reduce((sum, c) => sum + c.amount, 0);
        const netProfit = s.fee - totalCost;
        const margin = s.fee > 0 ? netProfit / s.fee : 0;
        return { ...s, costs: updatedCosts, totalCost, netProfit, margin };
      });
      recalcSummary(next);
      return next;
    });
  }

  function openCostDialog(shipment: ShipmentRow) {
    setSelectedShipment(shipment);
    setCosts(shipment.costs);
    setNewCategory("FUEL");
    setNewDescription("");
    setNewAmount("");
    setDialogOpen(true);
  }

  async function addCost() {
    if (!selectedShipment || !newDescription || !newAmount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/trip-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId: selectedShipment.id,
          category: newCategory,
          description: newDescription,
          amount: newAmount,
        }),
      });
      if (!res.ok) throw new Error();
      const cost = await res.json();
      const updatedCosts = [cost, ...costs];
      setCosts(updatedCosts);
      setSelectedShipment({ ...selectedShipment, costs: updatedCosts });
      updateRowCosts(selectedShipment.id, updatedCosts);
      setNewDescription("");
      setNewAmount("");
      sileo.success({ title: "Costo agregado correctamente" });
    } catch {
      sileo.error({ title: "Error al agregar costo" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteCost(id: string) {
    try {
      const res = await fetch(`/api/trip-costs?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      const updatedCosts = costs.filter((c) => c.id !== id);
      setCosts(updatedCosts);
      if (selectedShipment) {
        setSelectedShipment({ ...selectedShipment, costs: updatedCosts });
        updateRowCosts(selectedShipment.id, updatedCosts);
      }
      sileo.success({ title: "Costo eliminado" });
    } catch {
      sileo.error({ title: "Error al eliminar costo" });
    }
  }

  const filtered = search
    ? rows.filter(
        (r) =>
          r.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
          r.client.toLowerCase().includes(search.toLowerCase()),
      )
    : rows;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="w-full max-w-[calc(100vw-2rem)] space-y-6">
      <div className="flex items-center">
        <div className="flex items-center gap-3">
          <BsFillCreditCardFill className="h-8 w-8 text-gray-900" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Pagos y Rentabilidad
            </h2>
            <p className="text-sm text-gray-600">
              Administra los pagos y la rentabilidad de los envíos
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
                    <p className="text-sm text-gray-600">Total Ingresos</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.totalIncome)}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {summary.shipmentCount} envíos
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600">
                    <FaMoneyBill className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Costos</p>
                    <p className="mt-1 text-2xl font-bold text-red-600">
                      {formatCurrency(summary.totalCosts)}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {summary.shipmentsWithCosts} envíos con costos
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600">
                    <PiChartLineDownBold className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ganancia Neta</p>
                    <p
                      className={`mt-1 text-2xl font-bold ${summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(summary.netProfit)}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${summary.netProfit >= 0 ? "bg-green-600" : "bg-red-600"}`}
                  >
                    <PiChartLineUpBold className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Margen Promedio</p>
                    <p
                      className={`mt-1 text-2xl font-bold ${summary.margin >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatPercent(summary.margin)}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {summary.margin * 100 >= 30
                        ? "Rentabilidad saludable"
                        : summary.margin * 100 >= 0
                          ? "Margen ajustado"
                          : "Pérdida neta"}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${summary.margin >= 0.3 ? "bg-green-600" : summary.margin >= 0 ? "bg-yellow-600" : "bg-red-600"}`}
                  >
                    <FaChartSimple className="h-6 w-6 text-white" />
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
            <CardTitle className="text-base">Rentabilidad por envío</CardTitle>
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
                  <TableHead>FECHA</TableHead>
                  <TableHead>CLIENTE</TableHead>
                  <TableHead>CONDUCTOR</TableHead>
                  <TableHead>TARIFA</TableHead>
                  <TableHead>COSTOS</TableHead>
                  <TableHead>GANANCIA NETA</TableHead>
                  <TableHead>MARGEN</TableHead>
                  <TableHead>COSTOS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-gray-600 py-8"
                    >
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
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
                      <TableCell className="text-gray-600 whitespace-nowrap text-xs">
                        {new Date(r.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {r.client}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {r.driver || "—"}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {formatCurrency(r.fee)}
                      </TableCell>
                      <TableCell>
                        <span className="text-red-500 font-medium">
                          {r.totalCost > 0 ? formatCurrency(r.totalCost) : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${r.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {r.netProfit >= 0 ? "+" : ""}
                          {formatCurrency(r.netProfit)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${r.margin >= 0.3 ? "bg-green-500" : r.margin >= 0 ? "bg-yellow-500" : "bg-red-500"} text-xs`}
                        >
                          {formatPercent(r.margin)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          className="bg-gray-600 hover:bg-gray-700 h-8 gap-1.5 text-xs cursor-pointer"
                          onClick={() => openCostDialog(r)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {r.costs.length > 0
                            ? `${r.costs.length} costo${r.costs.length > 1 ? "s" : ""}`
                            : "Agregar"}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-sm md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-3">
              Costos de viaje
              <span className="text-blue-600">
                N° Seguimiento: {selectedShipment?.trackingNumber}
              </span>
            </DialogTitle>
            {selectedShipment && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedShipment.client} · Tarifa:{" "}
                {formatCurrency(selectedShipment.fee)}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryMeta).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="0.00"
                type="number"
                step="0.01"
                className="w-full h-9 pl-9"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
              <span className="absolute left-52 md:left-68 top-29 font-bold| text-gray-800">
                S/.
              </span>
              <Textarea
                placeholder="Descripción"
                className="w-full h-auto col-span-2 resize-none"
                rows={4}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <Button
                className="h-9 col-span-2"
                onClick={addCost}
                disabled={saving || !newDescription || !newAmount}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Agregando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    <span>Agregar</span>
                  </div>
                )}
              </Button>
            </div>

            {costs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No hay costos registrados para este envío
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {costs.map((c) => {
                  const meta = categoryMeta[c.category] || categoryMeta.OTHER;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={c.id}
                      className="flex md:items-center justify-between items-start rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.color}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col justify-start items-start">
                          <p className="text-sm font-medium text-gray-900 w-40">
                            {c.description}
                          </p>
                          <p className="text-xs text-gray-600">{meta.label}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(c.amount)}
                        </span>
                        <Button
                          onClick={() => deleteCost(c.id)}
                          variant="ghost"
                          size="icon"
                          title="Eliminar"
                          className="h-7 w-7 text-red-500 hover:bg-red-100 hover:text-red-600 cursor-pointer"
                        >
                          <IoMdTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedShipment && costs.length > 0 && (
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm font-medium text-gray-700">
                  Total costos
                </span>
                <span className="text-base font-bold text-red-600">
                  {formatCurrency(costs.reduce((s, c) => s + c.amount, 0))}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
