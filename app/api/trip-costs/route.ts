import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const shipmentId = searchParams.get("shipmentId")
  const year = searchParams.get("year")
  const month = searchParams.get("month")
  const search = searchParams.get("search")

  if (shipmentId) {
    const costs = await prisma.tripCost.findMany({
      where: { shipmentId },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(costs)
  }

  const whereShipment: any = {
    status: { not: "CANCELLED" },
  }

  if (year) {
    const y = parseInt(year)
    if (month && month !== "all") {
      const m = parseInt(month)
      whereShipment.createdAt = {
        gte: new Date(y, m, 1),
        lt: new Date(y, m + 1, 1),
      }
    } else {
      whereShipment.createdAt = {
        gte: new Date(y, 0, 1),
        lt: new Date(y + 1, 0, 1),
      }
    }
  }

  if (search) {
    whereShipment.OR = [
      { trackingNumber: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } },
    ]
  }

  const shipments = await prisma.shipment.findMany({
    where: whereShipment,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true } },
      driver: { select: { name: true } },
      costs: { orderBy: { createdAt: "desc" } },
    },
  })

  const rows = shipments.map((s) => {
    const totalCost = s.costs.reduce((sum, c) => sum + c.amount, 0)
    const netProfit = s.fee - totalCost
    const margin = s.fee > 0 ? netProfit / s.fee : 0
    return {
      id: s.id,
      trackingNumber: s.trackingNumber,
      client: s.client.name,
      driver: s.driver?.name ?? null,
      fee: s.fee,
      totalCost,
      netProfit,
      margin,
      costs: s.costs,
      status: s.status,
      createdAt: s.createdAt,
    }
  })

  const totalIncome = rows.reduce((s, r) => s + r.fee, 0)
  const totalCosts = rows.reduce((s, r) => s + r.totalCost, 0)
  const netProfit = rows.reduce((s, r) => s + r.netProfit, 0)
  const shipmentWithCosts = rows.filter((r) => r.costs.length > 0).length

  return NextResponse.json({
    rows,
    summary: {
      totalIncome,
      totalCosts,
      netProfit,
      margin: totalIncome > 0 ? netProfit / totalIncome : 0,
      shipmentCount: rows.length,
      shipmentsWithCosts: shipmentWithCosts,
    },
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { shipmentId, category, description, amount } = await request.json()

    if (!shipmentId || !category || !description || amount == null) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } })
    if (!shipment) {
      return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })
    }

    const cost = await prisma.tripCost.create({
      data: {
        shipmentId,
        category,
        description,
        amount: parseFloat(amount),
      },
    })

    return NextResponse.json(cost, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al crear el costo" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Falta el id del costo" }, { status: 400 })
    }

    await prisma.tripCost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al eliminar el costo" }, { status: 500 })
  }
}
