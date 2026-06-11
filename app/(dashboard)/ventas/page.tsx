"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { RiForbid2Fill } from "react-icons/ri";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import Pagination from "@/components/pagination";
import { FaCircleCheck } from "react-icons/fa6";
import { HiChartBar } from "react-icons/hi";
import { FaEye } from "react-icons/fa";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));
const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

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

const statusMeta: Record<string, { label: string; color: string }> = {
  EMITIDA: { label: "Emitida", color: "bg-blue-500" },
  COBRADA: { label: "Cobrada", color: "bg-green-500" },
  ANULADA: { label: "Anulada", color: "bg-red-500" },
};

interface InvoiceRow {
  id: string;
  docType: string;
  docNumber: string;
  client: string;
  ruc: string | null;
  issueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  createdBy: string;
  shipmentCount: number;
  shipments: {
    trackingNumber: string;
    fee: number;
    origin: string;
    destination: string;
  }[];
}

interface Client {
  id: string;
  name: string;
  ruc: string | null;
}

interface AvailableShipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  fee: number;
}

function formatCurrency(n: number) {
  return `S/. ${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const PAGE_SIZE = 10;

export default function VentasPage() {
  const [tab, setTab] = useState("listado");
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState("all");
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [newDocType, setNewDocType] = useState("FACTURA");
  const [newClientId, setNewClientId] = useState("");
  const [availableShipments, setAvailableShipments] = useState<
    AvailableShipment[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Dashboard data
  const [dashData, setDashData] = useState<any>(null);

  function fetchInvoices() {
    setLoading(true);
    const params = new URLSearchParams({ year });
    if (month !== "all") params.set("month", month);
    if (search) params.set("search", search);
    if (docTypeFilter !== "all") params.set("docType", docTypeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/invoices?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.rows)) {
          setRows(data.rows);
          setSummary(data.summary);
        }
      })
      .finally(() => setLoading(false));
  }

  function fetchDashboard() {
    fetch(`/api/sales?year=${year}`)
      .then((r) => r.json())
      .then((data) => setDashData(data));
  }

  useEffect(() => {
    fetchInvoices();
  }, [year, month, search, docTypeFilter, statusFilter]);
  useEffect(() => {
    if (tab === "dashboard") fetchDashboard();
  }, [tab, year]);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients);
  }, []);

  async function openNewDialog() {
    setNewClientId("");
    setNewDocType("FACTURA");
    setSelectedIds([]);
    setAvailableShipments([]);
    setNewDialogOpen(true);
  }

  async function onClientSelect(clientId: string) {
    setNewClientId(clientId);
    setSelectedIds([]);
    if (!clientId) {
      setAvailableShipments([]);
      return;
    }
    const res = await fetch(
      `/api/shipments?clientId=${clientId}&status=DELIVERED&available=true`,
    );
    const data = await res.json();
    setAvailableShipments(Array.isArray(data) ? data : []);
  }

  async function handleCreateInvoice() {
    if (!newClientId || selectedIds.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: newDocType,
          clientId: newClientId,
          shipmentIds: selectedIds,
        }),
      });
      if (!res.ok) throw new Error();
      sileo.success({
        title: `${newDocType === "FACTURA" ? "Factura" : "Boleta"} creada correctamente`,
      });
      setNewDialogOpen(false);
      fetchInvoices();
    } catch {
      sileo.error({ title: "Error al crear" });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      sileo.success({
        title: `Factura ${status === "COBRADA" ? "cobrada" : "anulada"}`,
      });
      fetchInvoices();
    } catch {
      sileo.error({ title: "Error al actualizar" });
    }
  }

  const subtotalSel = availableShipments
    .filter((s) => selectedIds.includes(s.id))
    .reduce((s, sh) => s + sh.fee, 0);
  const taxSel = Math.round(subtotalSel * 0.18 * 100) / 100;
  const totalSel = subtotalSel + taxSel;

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  async function openDetail(id: string) {
    const res = await fetch(`/api/invoices/${id}`);
    const data = await res.json();
    setDetail(data);
    setDetailOpen(true);
  }

  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;
    return (
      <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
        <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }

  const paginatedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="w-full max-w-[calc(100vw-2rem)] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <HiChartBar className="h-8 w-8 text-gray-900 shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ventas</h2>
            <p className="text-sm text-gray-600">
              Administra las ventas de los clientes
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-full sm:w-25 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openNewDialog} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Nueva Venta
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="listado">Listado</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="space-y-4 pt-4">
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600">Total Facturado</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(summary.totalIncome)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {summary.count} documentos
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600">IGV Total</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(summary.totalTax)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600">Cobrado</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(summary.cobrado)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {summary.cobradasCount} facturas
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600">Pendiente</p>
                  <p className="text-xl font-bold text-yellow-500">
                    {formatCurrency(summary.pendiente)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base">Documentos de Venta</CardTitle>
                <div className="flex flex-wrap items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                    <Input
                      placeholder="Buscar..."
                      className="h-9 w-full sm:w-48 pl-9"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  <Select
                    value={docTypeFilter}
                    onValueChange={(v) => {
                      setDocTypeFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-28 h-9">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="FACTURA">Factura</SelectItem>
                      <SelectItem value="BOLETA">Boleta</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-28 h-9">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="EMITIDA">Emitida</SelectItem>
                      <SelectItem value="COBRADA">Cobrada</SelectItem>
                      <SelectItem value="ANULADA">Anulada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={month}
                    onValueChange={(v) => {
                      setMonth(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-30 h-9">
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border">
                <Table>
                  <TableHeader className="bg-gray-200">
                    <TableRow>
                      <TableHead>DOC #</TableHead>
                      <TableHead>TIPO</TableHead>
                      <TableHead>CLIENTE</TableHead>
                      <TableHead>ENVÍOS</TableHead>
                      <TableHead>RUC</TableHead>
                      <TableHead>SUBTOTAL</TableHead>
                      <TableHead>IGV</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>ESTADO</TableHead>
                      <TableHead>FECHA</TableHead>
                      <TableHead className="w-28">ACCIONES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="text-center py-8 text-gray-600"
                        >
                          Cargando...
                        </TableCell>
                      </TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="text-center py-8 text-gray-600"
                        >
                          No hay documentos de venta
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((r) => {
                        const st = statusMeta[r.status] || {
                          label: r.status,
                          color: "bg-gray-500",
                        };
                        return (
                          <TableRow key={r.id} className="hover:bg-slate-50">
                            <TableCell className="font-medium text-gray-900">
                              {r.docNumber}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  r.docType === "FACTURA"
                                    ? "bg-amber-800"
                                    : "bg-purple-500"
                                }
                              >
                                {r.docType === "FACTURA" ? "Factura" : "Boleta"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {r.client}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              <div className="flex flex-wrap gap-1">
                                {r.shipments.map((sh, i) => (
                                  <Badge
                                    key={i}
                                    className="bg-gray-200 text-gray-700 text-xs font-mono"
                                  >
                                    {sh.trackingNumber}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600 font-mono text-xs">
                              {r.ruc || "—"}
                            </TableCell>
                            <TableCell className="text-gray-900">
                              {formatCurrency(r.subtotal)}
                            </TableCell>
                            <TableCell className="text-orange-600">
                              {formatCurrency(r.tax)}
                            </TableCell>
                            <TableCell className="font-semibold text-gray-900">
                              {formatCurrency(r.total)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${st.color} text-xs`}>
                                {st.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(r.issueDate)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Ver detalle"
                                  className="h-7 w-7 text-indigo-600 hover:text-indigo-600 hover:bg-indigo-100 cursor-pointer"
                                  onClick={() => openDetail(r.id)}
                                >
                                  <FaEye className="h-3.5 w-3.5" />
                                </Button>
                                {r.status === "EMITIDA" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Cobrar"
                                      className="h-7 w-7 text-green-500 hover:text-green-500 hover:bg-green-100 cursor-pointer"
                                      onClick={() =>
                                        handleStatusChange(r.id, "COBRADA")
                                      }
                                    >
                                      <FaCircleCheck className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Anular"
                                      className="h-7 w-7 text-red-500 hover:text-red-500 hover:bg-red-100 cursor-pointer"
                                      onClick={() =>
                                        handleStatusChange(r.id, "ANULADA")
                                      }
                                    >
                                      <RiForbid2Fill className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
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
                totalPages={Math.ceil(rows.length / PAGE_SIZE)}
                total={rows.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6 pt-4">
          {dashData ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="border-border">
                  <CardContent className="p-5">
                    <p className="text-sm text-gray-600">Ingresos Totales</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {formatCurrency(dashData.summary.totalIncome)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-5">
                    <p className="text-sm text-gray-600">Costos Totales</p>
                    <p className="mt-1 text-2xl font-bold text-red-600">
                      {formatCurrency(dashData.summary.totalCosts)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-5">
                    <p className="text-sm text-gray-600">Ganancia Neta</p>
                    <p
                      className={`mt-1 text-2xl font-bold ${dashData.summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(dashData.summary.netProfit)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-5">
                    <p className="text-sm text-gray-600">Margen</p>
                    <p
                      className={`mt-1 text-2xl font-bold ${dashData.summary.margin >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {(dashData.summary.margin * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-5">
                    <p className="text-sm text-gray-600">Documentos</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {dashData.summary.totalInvoices}
                    </p>
                    <p className="text-xs text-gray-600">
                      {dashData.summary.facturasCount}F /{" "}
                      {dashData.summary.boletasCount}B
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Ingresos vs Costos por Mes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dashData.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="income"
                          name="Ingresos"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="costs"
                          name="Costos"
                          fill="#EF4444"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Facturas vs Boletas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={dashData.byDocType}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={50}
                        >
                          {dashData.byDocType.map((_: any, i: number) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          formatter={(v: string) => (
                            <span className="text-xs text-gray-600">{v}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">
                    Top Clientes por Ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={dashData.byClient}
                      layout="vertical"
                      margin={{ left: 120 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 12 }}
                        width={110}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="income"
                        name="Ingresos"
                        fill="#10B981"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-gray-600">Cargando...</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Nueva Venta Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="w-full sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Cliente
                </label>
                <Select value={newClientId} onValueChange={onClientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.ruc ? `(${c.ruc})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tipo
                </label>
                <Select value={newDocType} onValueChange={setNewDocType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FACTURA">Factura</SelectItem>
                    <SelectItem value="BOLETA">Boleta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newClientId && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Envíos disponibles de este cliente (entregados, sin facturar)
                </label>
                {availableShipments.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">
                    No hay envíos disponibles para facturar
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader className="bg-gray-100">
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>TRACKING</TableHead>
                          <TableHead>ORIGEN</TableHead>
                          <TableHead>DESTINO</TableHead>
                          <TableHead>TARIFA</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableShipments.map((s) => (
                          <TableRow key={s.id} className="hover:bg-slate-50">
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.includes(s.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedIds(
                                    checked
                                      ? [...selectedIds, s.id]
                                      : selectedIds.filter((id) => id !== s.id),
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">
                              {s.trackingNumber}
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {s.origin}
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {s.destination}
                            </TableCell>
                            <TableCell className="text-gray-900">
                              {formatCurrency(s.fee)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {selectedIds.length > 0 && (
              <div className="rounded-lg bg-gray-50 p-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Subtotal ({selectedIds.length} envíos)
                  </span>
                  <span className="font-medium">
                    {formatCurrency(subtotalSel)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IGV (18%)</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(taxSel)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-border pt-1">
                  <span>Total</span>
                  <span>{formatCurrency(totalSel)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setNewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateInvoice}
                disabled={saving || selectedIds.length === 0}
              >
                {saving
                  ? "Creando..."
                  : `Emitir ${newDocType === "FACTURA" ? "Factura" : "Boleta"}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalle Factura Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="w-full sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.docNumber || "Detalle"}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Cliente</p>
                  <p className="font-medium">{detail.client.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">RUC</p>
                  <p className="font-mono">{detail.client.ruc || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Tipo</p>
                  <p>{detail.docType === "FACTURA" ? "Factura" : "Boleta"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Estado</p>
                  <Badge
                    className={
                      (statusMeta[detail.status] || {}).color || "bg-gray-500"
                    }
                  >
                    {(statusMeta[detail.status] || {}).label || detail.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-600">Fecha Emisión</p>
                  <p>{formatDate(detail.issueDate)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Creado por</p>
                  <p>{detail.createdBy.name}</p>
                </div>
              </div>

              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead>TRACKING</TableHead>
                      <TableHead>TARIFA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.shipments?.map((is: any) => (
                      <TableRow
                        key={is.shipmentId || is.shipment.trackingNumber}
                      >
                        <TableCell className="font-medium">
                          {is.shipment.trackingNumber}
                        </TableCell>
                        <TableCell>{formatCurrency(is.shipment.fee)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-1 text-sm border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(detail.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IGV (18%)</span>
                  <span className="text-orange-600">
                    {formatCurrency(detail.tax)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(detail.total)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-border">
                  <span className="text-gray-600">Costos reales</span>
                  <span className="text-red-600">
                    -{formatCurrency(detail.totalCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ganancia neta</span>
                  <span
                    className={
                      detail.netProfit >= 0
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {formatCurrency(detail.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
