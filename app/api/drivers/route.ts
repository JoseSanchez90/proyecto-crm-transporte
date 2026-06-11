import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const drivers = await prisma.driver.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { shipments: true } },
    },
  })

  return NextResponse.json(drivers)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { name, dni, email, phone, license } = await request.json()

  if (!name || !email || !phone || !license) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const exists = await prisma.driver.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
  }

  const driver = await prisma.driver.create({
    data: { name, dni: dni || null, email, phone, license },
  })

  return NextResponse.json(driver, { status: 201 })
}
