import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const DETRACCION_RATE = 0.04

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null

  const where: any = {
    status: { not: "CANCELLED" },
  }
  if (year && month !== null) {
    where.createdAt = {
      gte: new Date(year, month, 1),
      lt: new Date(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, 1),
    }
  } else if (year) {
    where.createdAt = {
      gte: new Date(year, 0, 1),
      lt: new Date(year + 1, 0, 1),
    }
  }

  const shipments = await prisma.shipment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      trackingNumber: true,
      fee: true,
      status: true,
      detraccionDeposited: true,
      createdAt: true,
      client: { select: { name: true } },
    },
  })

  let totalDetraccion = 0
  let totalDeposited = 0
  let totalPending = 0
  let depositedCount = 0
  let pendingCount = 0

  const rows = shipments.map((s) => {
    const detraccion = Math.round(s.fee * DETRACCION_RATE * 100) / 100
    const neto = s.fee - detraccion
    const deposited = s.detraccionDeposited

    totalDetraccion += detraccion
    if (deposited) {
      totalDeposited += detraccion
      depositedCount++
    } else {
      totalPending += detraccion
      pendingCount++
    }

    return {
      id: s.id,
      trackingNumber: s.trackingNumber,
      client: s.client.name,
      fee: s.fee,
      detraccion,
      neto,
      status: s.status,
      deposited,
      createdAt: s.createdAt.toISOString(),
    }
  })

  return NextResponse.json({
    summary: {
      totalDetraccion: Math.round(totalDetraccion * 100) / 100,
      totalDeposited: Math.round(totalDeposited * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      depositedCount,
      pendingCount,
      totalShipments: shipments.length,
      rate: DETRACCION_RATE,
    },
    rows,
    year,
    month,
  })
}
