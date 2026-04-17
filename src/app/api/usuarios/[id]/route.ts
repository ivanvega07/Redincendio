import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUserSchema, changePasswordSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Solo admin puede editar otros usuarios; cualquiera puede editarse a sí mismo
  const isSelf = session.user.id === params.id;
  if (!isSelf && session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.errors }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;
  const updateData: any = { ...rest, seccionId: rest.seccionId || null };
  if (password) {
    updateData.password = await bcrypt.hash(password, 12);
  }

  // Non-admins can't change their own rol
  if (isSelf && session.user.rol !== "ADMIN") {
    delete updateData.rol;
    delete updateData.seccionId;
    delete updateData.activo;
  }

  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true, username: true, nombre: true, apellido: true,
        dni: true, rol: true, activo: true, seccionId: true,
      },
    });
    return NextResponse.json(user);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Username o DNI ya existe" }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  if (session.user.id === params.id) {
    return NextResponse.json({ error: "No puede eliminarse a sí mismo" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { activo: false },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const isSelf = session.user.id === params.id;
  if (!isSelf) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const body = await req.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.errors }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const match = await bcrypt.compare(parsed.data.passwordActual, user.password);
  if (!match) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });

  await prisma.user.update({
    where: { id: params.id },
    data: { password: await bcrypt.hash(parsed.data.passwordNueva, 12) },
  });

  return NextResponse.json({ success: true });
}
