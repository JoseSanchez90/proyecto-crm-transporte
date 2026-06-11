import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      shipments: {
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true } },
        },
      },
    },
  })

  if (!driver) {
    return NextResponse.json({ error: "Conductor no encontrado" }, { status: 404 })
  }

  return NextResponse.json(driver)
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
  const { name, dni, email, phone, license } = await request.json()

  const driver = await prisma.driver.update({
    where: { id },
    data: { name, dni: dni || null, email, phone, license },
  })

  return NextResponse.json(driver)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  await prisma.driver.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
