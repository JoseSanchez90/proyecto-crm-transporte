"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDialog from "@/components/confirm-dialog";
import { FaBoxOpen, FaTrash } from "react-icons/fa6";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/pagination";
import { RiPencilFill } from "react-icons/ri";
import { IoMdTrash } from "react-icons/io";
import { FaUserFriends } from "react-icons/fa";

interface Client {
  id: string;
  name: string;
  ruc?: string | null;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  _count: { shipments: number };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const PAGE_SIZE = 10;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => setClients(data))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/clients/${deleteTarget}`, { method: "DELETE" });
    sileo.success({ title: "Cliente eliminado" });
    setClients(clients.filter((c) => c.id !== deleteTarget));
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="w-full max-w-[calc(100vw-2rem)] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FaUserFriends className="h-8 w-8 text-gray-900 shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
            <p className="text-sm text-gray-600">
              Administra los clientes del sistema
            </p>
          </div>
        </div>
        <Link href="/clientes/nuevo">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      <Card className="border-border max-w-5xl 2xl:max-w-full mx-auto">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Todos los clientes</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <Input
                placeholder="Buscar cliente..."
                className="h-9 w-full sm:w-64 pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader className="bg-gray-200">
                <TableRow>
                  <TableHead>NOMBRE</TableHead>
                  <TableHead>RUC</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>TELÉFONO</TableHead>
                  <TableHead>DIRECCIÓN</TableHead>
                  <TableHead>ENVÍOS</TableHead>
                  <TableHead>CREADO</TableHead>
                  <TableHead className="w-20">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-gray-600 py-8"
                    >
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-gray-600 py-8"
                    >
                      No hay clientes registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((client) => (
                    <TableRow
                      key={client.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">
                        {client.name}
                      </TableCell>
                      <TableCell className="text-gray-600 font-mono text-xs">
                        {client.ruc || "—"}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {client.email}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {client.phone}
                      </TableCell>
                      <TableCell className="max-w-50 truncate text-gray-600">
                        {client.address}
                      </TableCell>
                      <TableCell>
                        <Badge className="flex items-center gap-2 bg-indigo-600 w-6 h-6">
                          {client._count.shipments}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(client.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/clientes/${client.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              className="h-7 w-7 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100 cursor-pointer"
                            >
                              <RiPencilFill className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Eliminar"
                            className="h-7 w-7 text-red-500 hover:bg-red-100 hover:text-red-600 cursor-pointer"
                            onClick={() => {
                              setDeleteTarget(client.id);
                              setDeleteOpen(true);
                            }}
                          >
                            <IoMdTrash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar cliente"
        description="¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
