import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      shipments: {
        orderBy: { createdAt: "desc" },
        include: { driver: true },
      },
      invoices: {
        orderBy: { docNumber: "desc" },
        include: {
          shipments: {
            include: {
              shipment: { select: { trackingNumber: true } },
            },
          },
        },
      },
    },
  })

  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
  }

  return NextResponse.json(client)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  try {
    const body = await request.json()
    const client = await prisma.client.update({
      where: { id },
      data: {
        name: body.name,
        ruc: body.ruc || null,
        email: body.email,
        phone: body.phone,
        address: body.address,
      },
    })
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar el cliente" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  try {
    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ message: "Cliente eliminado" })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar el cliente" },
      { status: 500 }
    )
  }
}
