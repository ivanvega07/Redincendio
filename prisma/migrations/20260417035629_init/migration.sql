-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'JEFE_SECCION', 'JEFATURA', 'PERSONAL');

-- CreateEnum
CREATE TYPE "EstadoPlanilla" AS ENUM ('BORRADOR', 'ENVIADA', 'VISADA', 'REVOCADA', 'CARGADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "rol" "Role" NOT NULL,
    "seccionId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seccion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,

    CONSTRAINT "Seccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "puntajeMax" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planilla" (
    "id" TEXT NOT NULL,
    "seccionId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "estado" "EstadoPlanilla" NOT NULL DEFAULT 'BORRADOR',
    "firmadaPorJefe" BOOLEAN NOT NULL DEFAULT false,
    "fechaFirmaJefe" TIMESTAMP(3),
    "jefeId" TEXT,
    "visadaPorJefatura" BOOLEAN NOT NULL DEFAULT false,
    "fechaVisado" TIMESTAMP(3),
    "jefaturaId" TEXT,
    "revocada" BOOLEAN NOT NULL DEFAULT false,
    "motivoRevocacion" TEXT,
    "fechaRevocacion" TIMESTAMP(3),
    "cargadaEnSistema" BOOLEAN NOT NULL DEFAULT false,
    "fechaCarga" TIMESTAMP(3),
    "personalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Planilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calificacion" (
    "id" TEXT NOT NULL,
    "planillaId" TEXT NOT NULL,
    "bomberoId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "observacion" TEXT,

    CONSTRAINT "Calificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialPlanilla" (
    "id" TEXT NOT NULL,
    "planillaId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "detalle" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialPlanilla_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Seccion_numero_key" ON "Seccion"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Planilla_seccionId_mes_anio_key" ON "Planilla"("seccionId", "mes", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "Calificacion_planillaId_bomberoId_categoriaId_key" ON "Calificacion"("planillaId", "bomberoId", "categoriaId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planilla" ADD CONSTRAINT "Planilla_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planilla" ADD CONSTRAINT "Planilla_jefeId_fkey" FOREIGN KEY ("jefeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planilla" ADD CONSTRAINT "Planilla_jefaturaId_fkey" FOREIGN KEY ("jefaturaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planilla" ADD CONSTRAINT "Planilla_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_planillaId_fkey" FOREIGN KEY ("planillaId") REFERENCES "Planilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialPlanilla" ADD CONSTRAINT "HistorialPlanilla_planillaId_fkey" FOREIGN KEY ("planillaId") REFERENCES "Planilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialPlanilla" ADD CONSTRAINT "HistorialPlanilla_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
