import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, ruc: true, email: true, phone: true, address: true } },
      createdBy: { select: { name: true } },
      shipments: {
        include: {
          shipment: {
            include: {
              driver: { select: { name: true } },
              costs: { select: { amount: true } },
            },
          },
        },
      },
    },
  })

  if (!invoice) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
  }

  const totalCost = invoice.shipments.reduce(
    (s, is) => s + is.shipment.costs.reduce((c, ct) => c + ct.amount, 0),
    0,
  )

  return NextResponse.json({
    ...invoice,
    totalCost,
    netProfit: invoice.total - totalCost,
  })
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
  const body = await request.json()

  if (body.status === "ANULADA" && body.status) {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: body.status },
    })
    return NextResponse.json(invoice)
  }

  if (body.status === "COBRADA") {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: "COBRADA" },
    })
    return NextResponse.json(invoice)
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
}
