"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Eye, User } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/confirm-dialog";
import Pagination from "@/components/pagination";
import { FaEye, FaUserTie } from "react-icons/fa";
import { RiPencilFill } from "react-icons/ri";
import { IoMdTrash } from "react-icons/io";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
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

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<UserData | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/users/${deleteTarget}`, { method: "DELETE" });
    if (res.ok) {
      sileo.success({ title: "Usuario eliminado" });
      setUsers(users.filter((u) => u.id !== deleteTarget));
    }
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  const filtered = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="w-full max-w-[calc(100vw-2rem)] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FaUserTie className="h-8 w-8 text-gray-900 shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Empleados</h2>
            <p className="text-sm text-gray-600">
              Administra los usuarios del sistema
            </p>
          </div>
        </div>
        <Link href="/usuarios/nuevo">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nuevo Empleado
          </Button>
        </Link>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Todos los usuarios</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <Input
                placeholder="Buscar usuario..."
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
                  <TableHead>EMAIL</TableHead>
                  <TableHead>ROL</TableHead>
                  <TableHead>ENVÍOS</TableHead>
                  <TableHead>CREADO</TableHead>
                  <TableHead className="w-28">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-600 py-8"
                    >
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-600 py-8"
                    >
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((u) => (
                    <TableRow
                      key={u.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.image || undefined} />
                            <AvatarFallback className="bg-gray-100">
                              <User className="h-4 w-4 text-gray-600" />
                            </AvatarFallback>
                          </Avatar>
                          {u.name || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{u.email}</TableCell>
                      <TableCell>
                        <Badge
                          className={`py-3 ${
                            u.role === "ADMIN"
                              ? "bg-green-600"
                              : "bg-purple-600"
                          }`}
                        >
                          {u.role === "ADMIN" ? "Administrador" : "Operador"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <Badge className="flex items-center gap-2 h-6 w-6 rounded-full bg-indigo-600 text-white">
                          {u._count.shipments}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver detalle"
                            className="h-7 w-7 text-indigo-600 hover:text-indigo-600 hover:bg-indigo-100 cursor-pointer"
                            onClick={() => setViewUser(u)}
                          >
                            <FaEye className="h-3.5 w-3.5" />
                          </Button>
                          <Link href={`/usuarios/${u.id}`}>
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
                              setDeleteTarget(u.id);
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

      <Dialog
        open={!!viewUser}
        onOpenChange={(o) => {
          if (!o) setViewUser(null);
        }}
      >
        <DialogContent className="w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del usuario</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="h-48 w-48">
                <AvatarImage src={viewUser.image || undefined} />
                <AvatarFallback className="bg-gray-100 text-4xl text-gray-600">
                  <User className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1">
                <p className="text-xl font-semibold text-gray-900">
                  {viewUser.name || "—"}
                </p>
                <p className="text-sm text-gray-600">{viewUser.email}</p>
                <Badge variant={viewUser.role === "ADMIN" ? "info" : "warning"}>
                  {viewUser.role === "ADMIN" ? "Administrador" : "Operador"}
                </Badge>
                <p className="text-xs text-gray-600 pt-2">
                  Creado el{" "}
                  {new Date(viewUser.createdAt).toLocaleDateString("es-ES")}
                </p>
                <p className="text-xs text-gray-600">
                  {viewUser._count.shipments} envíos registrados
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar usuario"
        description="¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
