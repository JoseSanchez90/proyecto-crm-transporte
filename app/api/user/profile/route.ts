import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, image: true },
  })

  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, role: true, image: true },
    })
  }

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }
  return NextResponse.json(user)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await request.json()
  const { name, password, image } = body

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 })
  }

  let userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!userRecord && session.user.email) {
    userRecord = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
  }

  if (!userRecord) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  const data: any = { name: name.trim() }
  if (password && typeof password === "string" && password.length >= 6) {
    data.password = await bcrypt.hash(password, 10)
  }
  if (typeof image === "string") {
    data.image = image
  }

  const user = await prisma.user.update({
    where: { id: userRecord.id },
    data,
  })

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
  })
}
