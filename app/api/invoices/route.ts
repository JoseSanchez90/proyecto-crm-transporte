import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const year = searchParams.get("year")
  const month = searchParams.get("month")
  const search = searchParams.get("search")
  const docType = searchParams.get("docType")
  const status = searchParams.get("status")

  const where: any = {}

  if (year) {
    const y = parseInt(year)
    if (month && month !== "all") {
      const m = parseInt(month)
      where.issueDate = {
        gte: new Date(y, m, 1),
        lt: new Date(y, m + 1, 1),
      }
    } else {
      where.issueDate = {
        gte: new Date(y, 0, 1),
        lt: new Date(y + 1, 0, 1),
      }
    }
  }

  if (docType && docType !== "all") where.docType = docType
  if (status && status !== "all") where.status = status

  if (search) {
    where.OR = [
      { docNumber: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } },
      { client: { ruc: { contains: search, mode: "insensitive" } } },
    ]
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { docNumber: "desc" },
    include: {
      client: { select: { name: true, ruc: true } },
      createdBy: { select: { name: true } },
      shipments: {
        include: {
          shipment: {
            select: { trackingNumber: true, fee: true, origin: true, destination: true },
          },
        },
      },
    },
  })

  const rows = invoices.map((inv) => ({
    id: inv.id,
    docType: inv.docType,
    docNumber: inv.docNumber,
    client: inv.client.name,
    ruc: inv.client.ruc,
    issueDate: inv.issueDate,
    subtotal: inv.subtotal,
    tax: inv.tax,
    total: inv.total,
    status: inv.status,
    createdBy: inv.createdBy.name,
    shipments: inv.shipments.map((is) => ({
      trackingNumber: is.shipment.trackingNumber,
      fee: is.shipment.fee,
      origin: is.shipment.origin,
      destination: is.shipment.destination,
    })),
    shipmentCount: inv.shipments.length,
  }))

  const totalIncome = rows.reduce((s, r) => s + r.total, 0)
  const totalTax = rows.reduce((s, r) => s + r.tax, 0)
  const cobradas = rows.filter((r) => r.status === "COBRADA")
  const totalCobrado = cobradas.reduce((s, r) => s + r.total, 0)

  return NextResponse.json({
    rows,
    summary: {
      totalIncome,
      totalTax,
      cobrado: totalCobrado,
      pendiente: totalIncome - totalCobrado,
      count: rows.length,
      cobradasCount: cobradas.length,
    },
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { docType, clientId, shipmentIds, issueDate } = await request.json()

    if (!docType || !clientId || !shipmentIds || shipmentIds.length === 0) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const shipments = await prisma.shipment.findMany({
      where: { id: { in: shipmentIds } },
    })

    if (shipments.length !== shipmentIds.length) {
      return NextResponse.json({ error: "Uno o más envíos no encontrados" }, { status: 404 })
    }

    const subtotal = shipments.reduce((s, sh) => s + sh.fee, 0)
    const tax = Math.round(subtotal * 0.18 * 100) / 100
    const total = subtotal + tax

    const lastInvoice = await prisma.invoice.findFirst({
      where: { docType },
      orderBy: { docNumber: "desc" },
      select: { docNumber: true },
    })

    let nextNumber = 1
    if (lastInvoice) {
      const parts = lastInvoice.docNumber.split("-")
      nextNumber = parseInt(parts[1]) + 1
    }

    const prefix = docType === "FACTURA" ? "F" : "B"
    const docNumber = `${prefix}-${String(nextNumber).padStart(5, "0")}`

    const invoice = await prisma.invoice.create({
      data: {
        docType,
        docNumber,
        clientId,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        subtotal,
        tax,
        total,
        status: "EMITIDA",
        createdById: session.user.id,
        shipments: {
          create: shipmentIds.map((sid: string) => ({ shipmentId: sid })),
        },
      },
      include: {
        client: { select: { name: true, ruc: true } },
        createdBy: { select: { name: true } },
        shipments: {
          include: {
            shipment: { select: { trackingNumber: true, fee: true } },
          },
        },
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al crear factura" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Falta el id" }, { status: 400 })
  }

  try {
    await prisma.invoice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error al eliminar factura" }, { status: 500 })
  }
}
