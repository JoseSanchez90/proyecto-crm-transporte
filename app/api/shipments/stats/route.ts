import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const now = new Date()
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const totalShipments = await prisma.shipment.count()
  const pending = await prisma.shipment.count({ where: { status: "PENDING" } })
  const inTransit = await prisma.shipment.count({ where: { status: "IN_TRANSIT" } })
  const delivered = await prisma.shipment.count({ where: { status: "DELIVERED" } })

  const revenueResult = await prisma.shipment.aggregate({
    _sum: { fee: true },
  })
  const totalRevenue = revenueResult._sum.fee || 0

  const thisMonthRevenue = await prisma.shipment.aggregate({
    where: { createdAt: { gte: firstDayThisMonth } },
    _sum: { fee: true },
  })
  const lastMonthRevenue = await prisma.shipment.aggregate({
    where: { createdAt: { gte: firstDayLastMonth, lt: firstDayThisMonth } },
    _sum: { fee: true },
  })

  const revenueChange = lastMonthRevenue._sum.fee
    ? ((thisMonthRevenue._sum.fee! - lastMonthRevenue._sum.fee!) / lastMonthRevenue._sum.fee!) * 100
    : 0

  const thisMonthDelivered = await prisma.shipment.count({
    where: { status: "DELIVERED", createdAt: { gte: firstDayThisMonth } },
  })
  const lastMonthDelivered = await prisma.shipment.count({
    where: { status: "DELIVERED", createdAt: { gte: firstDayLastMonth, lt: firstDayThisMonth } },
  })
  const deliveredChange = lastMonthDelivered
    ? ((thisMonthDelivered - lastMonthDelivered) / lastMonthDelivered) * 100
    : 0

  const totalDrivers = await prisma.driver.count()
  const activeDrivers = await prisma.driver.count({
    where: { shipments: { some: { status: "IN_TRANSIT" } } },
  })

  return NextResponse.json({
    totalShipments,
    pending,
    inTransit,
    totalRevenue,
    delivered,
    revenueChange: Math.round(revenueChange * 10) / 10,
    deliveredChange: Math.round(deliveredChange * 10) / 10,
    totalDrivers,
    activeDrivers,
  })
}
