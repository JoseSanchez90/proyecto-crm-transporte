import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get("year")
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()

  const invoices = await prisma.invoice.findMany({
    where: {
      issueDate: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
      status: { not: "ANULADA" },
    },
    include: {
      client: { select: { name: true, ruc: true } },
      shipments: {
        include: {
          shipment: {
            include: {
              costs: { select: { amount: true } },
            },
          },
        },
      },
    },
    orderBy: { issueDate: "asc" },
  })

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthInvoices = invoices.filter(
      (inv) => new Date(inv.issueDate).getMonth() === i,
    )
    const income = monthInvoices.reduce((s, inv) => s + inv.total, 0)
    const costs = monthInvoices.reduce(
      (s, inv) =>
        s +
        inv.shipments.reduce(
          (c, is) => c + is.shipment.costs.reduce((cc, ct) => cc + ct.amount, 0),
          0,
        ),
      0,
    )
    return {
      month: i + 1,
      label: new Date(year, i).toLocaleString("es-ES", { month: "short" }),
      income,
      costs,
      profit: income - costs,
      count: monthInvoices.length,
    }
  })

  const clientMap: Record<string, { income: number; count: number }> = {}
  for (const inv of invoices) {
    const name = inv.client.name
    if (!clientMap[name]) clientMap[name] = { income: 0, count: 0 }
    clientMap[name].income += inv.total
    clientMap[name].count++
  }
  const byClient = Object.entries(clientMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.income - a.income)
    .slice(0, 10)

  const totalIncome = invoices.reduce((s, inv) => s + inv.total, 0)
  const totalCosts = invoices.reduce(
    (s, inv) =>
      s +
      inv.shipments.reduce(
        (c, is) => c + is.shipment.costs.reduce((cc, ct) => cc + ct.amount, 0),
        0,
      ),
    0,
  )

  const byDocType = [
    {
      name: "Facturas",
      value: invoices.filter((i) => i.docType === "FACTURA").reduce((s, i) => s + i.total, 0),
    },
    {
      name: "Boletas",
      value: invoices.filter((i) => i.docType === "BOLETA").reduce((s, i) => s + i.total, 0),
    },
  ]

  return NextResponse.json({
    summary: {
      totalIncome,
      totalCosts,
      netProfit: totalIncome - totalCosts,
      margin: totalIncome > 0 ? (totalIncome - totalCosts) / totalIncome : 0,
      totalInvoices: invoices.length,
      facturasCount: invoices.filter((i) => i.docType === "FACTURA").length,
      boletasCount: invoices.filter((i) => i.docType === "BOLETA").length,
    },
    byMonth: monthlyData,
    byClient,
    byDocType,
  })
}
