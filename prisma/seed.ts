import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de base de datos...");

  // Limpiar datos existentes en orden correcto
  await prisma.historialPlanilla.deleteMany();
  await prisma.calificacion.deleteMany();
  await prisma.planilla.deleteMany();
  await prisma.user.deleteMany();
  await prisma.seccion.deleteMany();
  await prisma.categoria.deleteMany();

  // Crear secciones
  const secciones = await Promise.all([
    prisma.seccion.create({ data: { nombre: "Mantenimiento", numero: 1 } }),
    prisma.seccion.create({ data: { nombre: "Equipos", numero: 2 } }),
    prisma.seccion.create({ data: { nombre: "Recursos Humanos", numero: 3 } }),
    prisma.seccion.create({ data: { nombre: "Técnica", numero: 4 } }),
    prisma.seccion.create({ data: { nombre: "Calidad y Mejora", numero: 5 } }),
  ]);

  console.log(`✅ ${secciones.length} secciones creadas`);

  // Crear categorías de evaluación
  const categorias = await Promise.all([
    prisma.categoria.create({
      data: {
        nombre: "Asistencia a Guardias",
        descripcion: "Puntualidad y presencia en guardias programadas",
        puntajeMax: 30,
        orden: 1,
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: "Instrucción",
        descripcion: "Participación en actividades de instrucción y entrenamiento",
        puntajeMax: 20,
        orden: 2,
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: "Servicios Realizados",
        descripcion: "Asistencia a servicios de emergencia y siniestros",
        puntajeMax: 25,
        orden: 3,
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: "Mantenimiento",
        descripcion: "Colaboración en tareas de mantenimiento del cuartel y equipos",
        puntajeMax: 10,
        orden: 4,
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: "Conducta",
        descripcion: "Comportamiento institucional y disciplina",
        puntajeMax: 10,
        orden: 5,
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: "Capacitación Externa",
        descripcion: "Cursos, seminarios y capacitaciones fuera del cuartel",
        puntajeMax: 5,
        orden: 6,
      },
    }),
  ]);

  console.log(`✅ ${categorias.length} categorías creadas`);

  const hashPassword = async (pass: string) => bcrypt.hash(pass, 12);

  // Crear usuario ADMIN
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      password: await hashPassword("admin123"),
      nombre: "Administrador",
      apellido: "Sistema",
      dni: "00000001",
      rol: Role.ADMIN,
    },
  });

  // Crear usuario JEFATURA
  const jefatura = await prisma.user.create({
    data: {
      username: "jefatura",
      password: await hashPassword("jefatura123"),
      nombre: "Carlos",
      apellido: "Rodríguez",
      dni: "20123456",
      rol: Role.JEFATURA,
    },
  });

  // Crear usuario PERSONAL
  const personal = await prisma.user.create({
    data: {
      username: "personal",
      password: await hashPassword("personal123"),
      nombre: "María",
      apellido: "González",
      dni: "25987654",
      rol: Role.PERSONAL,
    },
  });

  console.log(`✅ Usuarios especiales creados: admin, jefatura, personal`);

  // Nombres de bomberos ficticios
  const bomberosPorSeccion = [
    [
      { nombre: "Lucas", apellido: "Fernández", dni: "30111001" },
      { nombre: "Sofía", apellido: "Martínez", dni: "32222001" },
      { nombre: "Mateo", apellido: "López", dni: "28333001" },
      { nombre: "Valentina", apellido: "García", dni: "35444001" },
    ],
    [
      { nombre: "Nicolás", apellido: "Pérez", dni: "29555002" },
      { nombre: "Camila", apellido: "Sánchez", dni: "33666002" },
      { nombre: "Agustín", apellido: "Díaz", dni: "27777002" },
      { nombre: "Florencia", apellido: "Torres", dni: "36888002" },
    ],
    [
      { nombre: "Santiago", apellido: "Ramírez", dni: "31999003" },
      { nombre: "Lucía", apellido: "Flores", dni: "34000003" },
      { nombre: "Gonzalo", apellido: "Morales", dni: "26111003" },
      { nombre: "Antonella", apellido: "Jiménez", dni: "37222003" },
    ],
    [
      { nombre: "Facundo", apellido: "Herrera", dni: "28333004" },
      { nombre: "Micaela", apellido: "Castro", dni: "33444004" },
      { nombre: "Rodrigo", apellido: "Ruiz", dni: "30555004" },
      { nombre: "Pilar", apellido: "Vargas", dni: "35666004" },
    ],
    [
      { nombre: "Tomás", apellido: "Medina", dni: "29777005" },
      { nombre: "Julieta", apellido: "Reyes", dni: "32888005" },
      { nombre: "Ignacio", apellido: "Silva", dni: "27999005" },
      { nombre: "Rocío", apellido: "Ortiz", dni: "36000005" },
    ],
  ];

  // Crear jefes de sección y bomberos
  for (let i = 0; i < secciones.length; i++) {
    const seccion = secciones[i];
    const num = i + 1;

    // Jefe de sección
    await prisma.user.create({
      data: {
        username: `jefe${num}`,
        password: await hashPassword("jefe123"),
        nombre: `Jefe${num}`,
        apellido: `SeccionNombre${num}`,
        dni: `1000000${num}`,
        rol: Role.JEFE_SECCION,
        seccionId: seccion.id,
      },
    });

    // Bomberos de la sección
    const bomberos = bomberosPorSeccion[i];
    for (const b of bomberos) {
      await prisma.user.create({
        data: {
          ...b,
          username: `${b.nombre.toLowerCase()}.${b.apellido.toLowerCase()}`,
          password: await hashPassword("bombero123"),
          rol: Role.JEFE_SECCION, // rol JEFE_SECCION para que aparezcan en la sección
          seccionId: seccion.id,
        },
      });
    }
  }

  console.log(`✅ Jefes de sección y bomberos creados`);
  console.log("\n📋 Credenciales de acceso:");
  console.log("  ADMIN:    admin / admin123");
  console.log("  JEFATURA: jefatura / jefatura123");
  console.log("  PERSONAL: personal / personal123");
  console.log("  JEFE 1:   jefe1 / jefe123");
  console.log("  JEFE 2:   jefe2 / jefe123");
  console.log("  JEFE 3:   jefe3 / jefe123");
  console.log("  JEFE 4:   jefe4 / jefe123");
  console.log("  JEFE 5:   jefe5 / jefe123");
  console.log("\n🎉 Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
