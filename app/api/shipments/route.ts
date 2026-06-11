import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { geocodeAddress } from "@/lib/geocode"
import { haversineKm } from "@/lib/distance"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const search = searchParams.get("search")
  const clientId = searchParams.get("clientId")
  const available = searchParams.get("available")

  const where: any = {}
  if (status) where.status = status
  if (clientId) where.clientId = clientId

  if (available === "true") {
    where.status = "DELIVERED"
    where.invoiceShipments = { none: {} }
  }

  if (search) {
    where.OR = [
      { trackingNumber: { contains: search, mode: "insensitive" } },
      { origin: { contains: search, mode: "insensitive" } },
      { destination: { contains: search, mode: "insensitive" } },
    ]
  }

  const shipments = await prisma.shipment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, id: true } },
      driver: { select: { name: true, id: true } },
      invoiceShipments: { select: { invoiceId: true } },
    },
  })

  return NextResponse.json(shipments)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const [originCoords, destCoords] = await Promise.all([
      geocodeAddress(body.origin),
      geocodeAddress(body.destination),
    ])

    const finalOriginLat = originCoords?.lat ?? (body.originLat ? parseFloat(body.originLat) : null)
    const finalOriginLng = originCoords?.lng ?? (body.originLng ? parseFloat(body.originLng) : null)
    const finalDestLat = destCoords?.lat ?? (body.destLat ? parseFloat(body.destLat) : null)
    const finalDestLng = destCoords?.lng ?? (body.destLng ? parseFloat(body.destLng) : null)

    const distance = finalOriginLat != null && finalDestLat != null
      ? haversineKm(finalOriginLat, finalOriginLng ?? 0, finalDestLat, finalDestLng ?? 0)
      : null

    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber: body.trackingNumber,
        category: body.category,
        origin: body.origin,
        destination: body.destination,
        weight: parseFloat(body.weight),
        fee: parseFloat(body.fee),
        status: body.status || "PENDING",
        estimatedArrival: body.estimatedArrival ? new Date(body.estimatedArrival) : null,
        originLat: finalOriginLat,
        originLng: finalOriginLng,
        destLat: finalDestLat,
        destLng: finalDestLng,
        distance,
        clientId: body.clientId,
        driverId: body.driverId || null,
        createdById: session.user.id,
      },
      include: {
        client: { select: { name: true, id: true } },
        driver: { select: { name: true, id: true } },
      },
    })
    return NextResponse.json(shipment, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Error al crear el envío" },
      { status: 500 }
    )
  }
}
