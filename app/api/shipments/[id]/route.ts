import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { haversineKm } from "@/lib/distance"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      client: true,
      driver: true,
      createdBy: { select: { name: true, email: true } },
      invoiceShipments: {
        include: {
          invoice: { select: { docNumber: true, docType: true, id: true } },
        },
      },
    },
  })

  if (!shipment) {
    return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })
  }

  return NextResponse.json(shipment)
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

    const originLat = body.originLat ? parseFloat(body.originLat) : null
    const originLng = body.originLng ? parseFloat(body.originLng) : null
    const destLat = body.destLat ? parseFloat(body.destLat) : null
    const destLng = body.destLng ? parseFloat(body.destLng) : null

    const distance = originLat != null && destLat != null
      ? haversineKm(originLat, originLng ?? 0, destLat, destLng ?? 0)
      : null

    const shipment = await prisma.shipment.update({
      where: { id },
      data: {
        category: body.category,
        origin: body.origin,
        destination: body.destination,
        weight: parseFloat(body.weight),
        fee: parseFloat(body.fee),
        status: body.status,
        estimatedArrival: body.estimatedArrival ? new Date(body.estimatedArrival) : null,
        originLat,
        originLng,
        destLat,
        destLng,
        distance,
        clientId: body.clientId,
        driverId: body.driverId || null,
      },
      include: {
        client: { select: { name: true, id: true } },
        driver: { select: { name: true, id: true } },
      },
    })
    return NextResponse.json(shipment)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar el envío" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { status, driverId, detraccionDeposited } = await request.json()

  const data: any = {}
  if (status) data.status = status
  if (driverId !== undefined) data.driverId = driverId || null
  if (detraccionDeposited !== undefined) data.detraccionDeposited = detraccionDeposited

  const shipment = await prisma.shipment.update({
    where: { id },
    data,
    include: {
      client: { select: { name: true, id: true } },
      driver: { select: { name: true, id: true } },
      createdBy: { select: { name: true, email: true } },
    },
  })

  return NextResponse.json(shipment)
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
    await prisma.shipment.delete({ where: { id } })
    return NextResponse.json({ message: "Envío eliminado" })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar el envío" },
      { status: 500 }
    )
  }
}
