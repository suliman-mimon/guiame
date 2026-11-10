import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// Dev-only demo data. Never exposed beyond this file's internal/action
// functions; run manually with `npx convex run seed:seedDemoData`.

const PICTOGRAMS: {
  label: string;
  keywords: string[];
  category: string;
  arasaacId: string;
  imageUrl: string;
}[] = [
  { label: "descanso", keywords: ["descanso"], category: "rutina", arasaacId: "24503", imageUrl: "https://static.arasaac.org/pictograms/24503/24503_500.png" },
  { label: "recreo", keywords: ["recreo", "patio"], category: "rutina", arasaacId: "33064", imageUrl: "https://static.arasaac.org/pictograms/33064/33064_500.png" },
  { label: "asamblea", keywords: ["asamblea"], category: "rutina", arasaacId: "27574", imageUrl: "https://static.arasaac.org/pictograms/27574/27574_500.png" },
  { label: "autobús", keywords: ["autobús", "colectivo", "micro"], category: "rutina", arasaacId: "2262", imageUrl: "https://static.arasaac.org/pictograms/2262/2262_500.png" },
  { label: "casa", keywords: ["casa"], category: "rutina", arasaacId: "6964", imageUrl: "https://static.arasaac.org/pictograms/6964/6964_500.png" },
  { label: "fila", keywords: ["fila"], category: "rutina", arasaacId: "7102", imageUrl: "https://static.arasaac.org/pictograms/7102/7102_500.png" },
  { label: "mochila", keywords: ["mochila"], category: "rutina", arasaacId: "2475", imageUrl: "https://static.arasaac.org/pictograms/2475/2475_500.png" },
  { label: "agenda", keywords: ["agenda"], category: "rutina", arasaacId: "5898", imageUrl: "https://static.arasaac.org/pictograms/5898/5898_500.png" },
  { label: "reloj", keywords: ["reloj"], category: "rutina", arasaacId: "2549", imageUrl: "https://static.arasaac.org/pictograms/2549/2549_500.png" },
  { label: "desayuno", keywords: ["desayuno"], category: "comida", arasaacId: "4626", imageUrl: "https://static.arasaac.org/pictograms/4626/4626_500.png" },
  { label: "comedor", keywords: ["comedor"], category: "comida", arasaacId: "5970", imageUrl: "https://static.arasaac.org/pictograms/5970/5970_500.png" },
  { label: "almuerzo", keywords: ["almuerzo", "almorzar"], category: "comida", arasaacId: "28207", imageUrl: "https://static.arasaac.org/pictograms/28207/28207_500.png" },
  { label: "merienda", keywords: ["merienda"], category: "comida", arasaacId: "4695", imageUrl: "https://static.arasaac.org/pictograms/4695/4695_500.png" },
  { label: "fruta", keywords: ["fruta", "frutas"], category: "comida", arasaacId: "28339", imageUrl: "https://static.arasaac.org/pictograms/28339/28339_500.png" },
  { label: "agua", keywords: ["agua"], category: "comida", arasaacId: "32464", imageUrl: "https://static.arasaac.org/pictograms/32464/32464_500.png" },
  { label: "comer", keywords: ["comer"], category: "comida", arasaacId: "6456", imageUrl: "https://static.arasaac.org/pictograms/6456/6456_500.png" },
  { label: "cocinar", keywords: ["cocinar", "guisar"], category: "comida", arasaacId: "2342", imageUrl: "https://static.arasaac.org/pictograms/2342/2342_500.png" },
  { label: "pan", keywords: ["pan", "barra de pan"], category: "comida", arasaacId: "2494", imageUrl: "https://static.arasaac.org/pictograms/2494/2494_500.png" },
  { label: "baño", keywords: ["cuarto de baño", "baño"], category: "higiene", arasaacId: "6929", imageUrl: "https://static.arasaac.org/pictograms/6929/6929_500.png" },
  { label: "ducha", keywords: ["ducha"], category: "higiene", arasaacId: "32426", imageUrl: "https://static.arasaac.org/pictograms/32426/32426_500.png" },
  { label: "feliz", keywords: ["contento", "feliz", "contenta"], category: "emociones", arasaacId: "9907", imageUrl: "https://static.arasaac.org/pictograms/9907/9907_500.png" },
  { label: "triste", keywords: ["triste"], category: "emociones", arasaacId: "35545", imageUrl: "https://static.arasaac.org/pictograms/35545/35545_500.png" },
  { label: "enfadado", keywords: ["enfadado", "enfadada"], category: "emociones", arasaacId: "35539", imageUrl: "https://static.arasaac.org/pictograms/35539/35539_500.png" },
  { label: "tranquilo", keywords: ["tranquilo", "tranquila"], category: "emociones", arasaacId: "31310", imageUrl: "https://static.arasaac.org/pictograms/31310/31310_500.png" },
  { label: "cansado", keywords: ["cansado", "cansada"], category: "emociones", arasaacId: "35537", imageUrl: "https://static.arasaac.org/pictograms/35537/35537_500.png" },
  { label: "nervioso", keywords: ["nervioso", "nerviosa"], category: "emociones", arasaacId: "30391", imageUrl: "https://static.arasaac.org/pictograms/30391/30391_500.png" },
  { label: "sorprendido", keywords: ["sorprendido", "sorprendida", "impresionado", "impresionada"], category: "emociones", arasaacId: "35529", imageUrl: "https://static.arasaac.org/pictograms/35529/35529_500.png" },
  { label: "preocupado", keywords: ["preocupado", "preocupar", "preocuparse"], category: "emociones", arasaacId: "26985", imageUrl: "https://static.arasaac.org/pictograms/26985/26985_500.png" },
  { label: "matemáticas", keywords: ["clase de matemáticas", "matemáticas"], category: "academico", arasaacId: "32554", imageUrl: "https://static.arasaac.org/pictograms/32554/32554_500.png" },
  { label: "lengua", keywords: ["lengua"], category: "academico", arasaacId: "2944", imageUrl: "https://static.arasaac.org/pictograms/2944/2944_500.png" },
  { label: "música", keywords: ["música", "composición", "partitura", "pentagrama", "canción"], category: "academico", arasaacId: "24791", imageUrl: "https://static.arasaac.org/pictograms/24791/24791_500.png" },
  { label: "inglés", keywords: ["inglés", "clase de inglés"], category: "academico", arasaacId: "32705", imageUrl: "https://static.arasaac.org/pictograms/32705/32705_500.png" },
  { label: "educación física", keywords: ["educación física", "brazos en cruz"], category: "academico", arasaacId: "31945", imageUrl: "https://static.arasaac.org/pictograms/31945/31945_500.png" },
  { label: "plástica", keywords: ["manualidades", "trabajos manuales", "plástica"], category: "academico", arasaacId: "7794", imageUrl: "https://static.arasaac.org/pictograms/7794/7794_500.png" },
  { label: "leer", keywords: ["leer"], category: "academico", arasaacId: "7141", imageUrl: "https://static.arasaac.org/pictograms/7141/7141_500.png" },
  { label: "escribir", keywords: ["escribir", "escritura"], category: "academico", arasaacId: "2380", imageUrl: "https://static.arasaac.org/pictograms/2380/2380_500.png" },
  { label: "dibujo", keywords: ["dibujo"], category: "academico", arasaacId: "11238", imageUrl: "https://static.arasaac.org/pictograms/11238/11238_500.png" },
  { label: "juego", keywords: ["juegos didácticos", "juego"], category: "ocio", arasaacId: "36405", imageUrl: "https://static.arasaac.org/pictograms/36405/36405_500.png" },
  { label: "pintar", keywords: ["pintar", "colorear"], category: "ocio", arasaacId: "2348", imageUrl: "https://static.arasaac.org/pictograms/2348/2348_500.png" },
  { label: "bailar", keywords: ["baile", "bailar"], category: "ocio", arasaacId: "35747", imageUrl: "https://static.arasaac.org/pictograms/35747/35747_500.png" },
  { label: "parque", keywords: ["parque"], category: "ocio", arasaacId: "2859", imageUrl: "https://static.arasaac.org/pictograms/2859/2859_500.png" },
  { label: "deporte", keywords: ["deporte", "deportes"], category: "ocio", arasaacId: "7010", imageUrl: "https://static.arasaac.org/pictograms/7010/7010_500.png" },
  { label: "ordenador", keywords: ["ordenador", "computador", "computadora"], category: "ocio", arasaacId: "7190", imageUrl: "https://static.arasaac.org/pictograms/7190/7190_500.png" },
  { label: "cuento", keywords: ["cuento"], category: "ocio", arasaacId: "2364", imageUrl: "https://static.arasaac.org/pictograms/2364/2364_500.png" },
  { label: "puzzle", keywords: ["puzzle"], category: "ocio", arasaacId: "2540", imageUrl: "https://static.arasaac.org/pictograms/2540/2540_500.png" },
  { label: "logopedia", keywords: ["logopedia", "fonoaudiología"], category: "profesional", arasaacId: "32428", imageUrl: "https://static.arasaac.org/pictograms/32428/32428_500.png" },
  { label: "fisioterapia", keywords: ["fisioterapia"], category: "profesional", arasaacId: "5998", imageUrl: "https://static.arasaac.org/pictograms/5998/5998_500.png" },
  { label: "psicología", keywords: ["psicología"], category: "profesional", arasaacId: "39880", imageUrl: "https://static.arasaac.org/pictograms/39880/39880_500.png" },
  { label: "terapia ocupacional", keywords: ["terapia ocupacional"], category: "profesional", arasaacId: "24821", imageUrl: "https://static.arasaac.org/pictograms/24821/24821_500.png" },
  { label: "familia", keywords: ["familia"], category: "familiar", arasaacId: "38351", imageUrl: "https://static.arasaac.org/pictograms/38351/38351_500.png" },
  { label: "padre", keywords: ["padre"], category: "familiar", arasaacId: "2497", imageUrl: "https://static.arasaac.org/pictograms/2497/2497_500.png" },
  { label: "madre", keywords: ["madre"], category: "familiar", arasaacId: "31148", imageUrl: "https://static.arasaac.org/pictograms/31148/31148_500.png" },
  { label: "hermano", keywords: ["hermano"], category: "familiar", arasaacId: "2423", imageUrl: "https://static.arasaac.org/pictograms/2423/2423_500.png" },
  { label: "abuela", keywords: ["abuela", "yaya"], category: "familiar", arasaacId: "23710", imageUrl: "https://static.arasaac.org/pictograms/23710/23710_500.png" },
  { label: "comunicación", keywords: ["exposición", "presentar", "exponer", "comunicación", "presentación"], category: "otros", arasaacId: "9870", imageUrl: "https://static.arasaac.org/pictograms/9870/9870_500.png" },
  { label: "pregunta", keywords: ["pregunta"], category: "otros", arasaacId: "7217", imageUrl: "https://static.arasaac.org/pictograms/7217/7217_500.png" },
  { label: "ayuda", keywords: ["apoyo", "ayuda", "colaboración", "cooperación"], category: "otros", arasaacId: "12252", imageUrl: "https://static.arasaac.org/pictograms/12252/12252_500.png" },
  { label: "esperar", keywords: ["esperar"], category: "otros", arasaacId: "36914", imageUrl: "https://static.arasaac.org/pictograms/36914/36914_500.png" },
  { label: "silencio", keywords: ["silencio", "callar", "silenciar", "pedir silencio"], category: "otros", arasaacId: "5936", imageUrl: "https://static.arasaac.org/pictograms/5936/5936_500.png" },
  { label: "entrar a clase", keywords: ["aula", "clase"], category: "rutina", arasaacId: "9815", imageUrl: "https://static.arasaac.org/pictograms/9815/9815_500.png" },
  { label: "cepillarse los dientes", keywords: ["cepillo eléctrico", "cepillo de dientes eléctrico"], category: "higiene", arasaacId: "26744", imageUrl: "https://static.arasaac.org/pictograms/26744/26744_500.png" },
  { label: "ciencias naturales", keywords: ["ciencias de la naturaleza", "ciencias"], category: "academico", arasaacId: "35437", imageUrl: "https://static.arasaac.org/pictograms/35437/35437_500.png" },
  { label: "geografía", keywords: ["mapa"], category: "academico", arasaacId: "5505", imageUrl: "https://static.arasaac.org/pictograms/5505/5505_500.png" },
  { label: "lavarse las manos", keywords: ["lavar", "lavado de manos"], category: "higiene", arasaacId: "8977", imageUrl: "https://static.arasaac.org/pictograms/8977/8977_500.png" },
  { label: "peinarse", keywords: ["peine"], category: "higiene", arasaacId: "2852", imageUrl: "https://static.arasaac.org/pictograms/2852/2852_500.png" },
];

const TUTOR = { name: "Marta Ruiz", email: "marta.ruiz@centro.es" };
const DEMO_PASSWORD = "GuiaMe#2026";

const STUDENTS: { key: string; name: string; email: string }[] = [
  { key: "lucia", name: "Lucía M.", email: "lucia.m@centro.es" },
  { key: "daniel", name: "Daniel R.", email: "daniel.r@centro.es" },
  { key: "aitana", name: "Aitana G.", email: "aitana.g@centro.es" },
  { key: "hugo", name: "Hugo P.", email: "hugo.p@centro.es" },
  { key: "sara", name: "Sara L.", email: "sara.l@centro.es" },
  { key: "mateo", name: "Mateo C.", email: "mateo.c@centro.es" },
];

export const isSeeded = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("classrooms").take(1);
    return existing.length > 0;
  },
});

export const seedDemoData = action({
  args: {},
  returns: v.object({
    alreadySeeded: v.boolean(),
    credentials: v.array(
      v.object({
        role: v.string(),
        name: v.string(),
        email: v.string(),
        password: v.string(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const seeded: boolean = await ctx.runQuery(internal.seed.isSeeded, {});
    if (seeded) {
      return { alreadySeeded: true, credentials: [] };
    }

    const { user: tutorUser } = await createAccount(ctx, {
      provider: "password",
      account: { id: TUTOR.email, secret: DEMO_PASSWORD },
      profile: { name: TUTOR.name, email: TUTOR.email },
    });

    const students: { key: string; name: string; userId: Id<"users"> }[] = [];
    for (const s of STUDENTS) {
      const { user } = await createAccount(ctx, {
        provider: "password",
        account: { id: s.email, secret: DEMO_PASSWORD },
        profile: { name: s.name, email: s.email },
      });
      students.push({ key: s.key, name: s.name, userId: user._id });
    }

    await ctx.runMutation(internal.seed.insertWorld, {
      tutorUserId: tutorUser._id,
      students,
    });

    const credentials = [
      { role: "tutor", name: TUTOR.name, email: TUTOR.email, password: DEMO_PASSWORD },
      ...STUDENTS.map((s) => ({
        role: "student",
        name: s.name,
        email: s.email,
        password: DEMO_PASSWORD,
      })),
    ];
    return { alreadySeeded: false, credentials };
  },
});

type ActivityType = "academica" | "profesional" | "familiar" | "del_estudiante";
type AssignmentStatus = "pending" | "in_progress" | "completed";

type TodaySlot = {
  title: string;
  pictogramLabel: string;
  type: ActivityType;
  startOffsetMin: number;
  endOffsetMin: number;
  status: AssignmentStatus;
  startedOffsetMin?: number;
};

const TODAY_SCHEDULES: Record<string, TodaySlot[]> = {
  lucia: [
    { title: "Asamblea", pictogramLabel: "asamblea", type: "academica", startOffsetMin: -180, endOffsetMin: -150, status: "completed" },
    { title: "Matemáticas", pictogramLabel: "matemáticas", type: "academica", startOffsetMin: -140, endOffsetMin: -90, status: "completed" },
    { title: "Desayuno", pictogramLabel: "desayuno", type: "del_estudiante", startOffsetMin: -80, endOffsetMin: -55, status: "completed" },
    { title: "Recreo", pictogramLabel: "recreo", type: "del_estudiante", startOffsetMin: -15, endOffsetMin: 15, status: "in_progress", startedOffsetMin: -13 },
    { title: "Logopedia", pictogramLabel: "logopedia", type: "profesional", startOffsetMin: -12, endOffsetMin: 48, status: "pending" },
    { title: "Música", pictogramLabel: "música", type: "academica", startOffsetMin: 60, endOffsetMin: 120, status: "pending" },
    { title: "Comedor", pictogramLabel: "comedor", type: "del_estudiante", startOffsetMin: 130, endOffsetMin: 190, status: "pending" },
    { title: "Ir a casa", pictogramLabel: "casa", type: "familiar", startOffsetMin: 200, endOffsetMin: 230, status: "pending" },
  ],
  daniel: [
    { title: "Entrar a clase", pictogramLabel: "entrar a clase", type: "academica", startOffsetMin: -200, endOffsetMin: -170, status: "completed" },
    { title: "Lengua", pictogramLabel: "lengua", type: "academica", startOffsetMin: -165, endOffsetMin: -120, status: "completed" },
    { title: "Desayuno", pictogramLabel: "desayuno", type: "del_estudiante", startOffsetMin: -110, endOffsetMin: -90, status: "completed" },
    { title: "Recreo", pictogramLabel: "recreo", type: "del_estudiante", startOffsetMin: -85, endOffsetMin: -55, status: "completed" },
    { title: "Música", pictogramLabel: "música", type: "academica", startOffsetMin: -10, endOffsetMin: 20, status: "in_progress", startedOffsetMin: -8 },
    { title: "Comedor", pictogramLabel: "comedor", type: "del_estudiante", startOffsetMin: 90, endOffsetMin: 150, status: "pending" },
    { title: "Ir a casa", pictogramLabel: "casa", type: "familiar", startOffsetMin: 160, endOffsetMin: 190, status: "pending" },
  ],
  aitana: [
    { title: "Entrar a clase", pictogramLabel: "entrar a clase", type: "academica", startOffsetMin: -200, endOffsetMin: -170, status: "completed" },
    { title: "Matemáticas", pictogramLabel: "matemáticas", type: "academica", startOffsetMin: -165, endOffsetMin: -120, status: "completed" },
    { title: "Desayuno", pictogramLabel: "desayuno", type: "del_estudiante", startOffsetMin: -110, endOffsetMin: -90, status: "completed" },
    { title: "Recreo", pictogramLabel: "recreo", type: "del_estudiante", startOffsetMin: -5, endOffsetMin: 25, status: "in_progress", startedOffsetMin: -3 },
    { title: "Logopedia", pictogramLabel: "logopedia", type: "profesional", startOffsetMin: 40, endOffsetMin: 100, status: "pending" },
    { title: "Dibujo", pictogramLabel: "dibujo", type: "academica", startOffsetMin: 110, endOffsetMin: 160, status: "pending" },
    { title: "Comedor", pictogramLabel: "comedor", type: "del_estudiante", startOffsetMin: 170, endOffsetMin: 230, status: "pending" },
    { title: "Ir a casa", pictogramLabel: "casa", type: "familiar", startOffsetMin: 240, endOffsetMin: 270, status: "pending" },
  ],
  hugo: [
    { title: "Entrar a clase", pictogramLabel: "entrar a clase", type: "academica", startOffsetMin: -200, endOffsetMin: -170, status: "completed" },
    { title: "Desayuno", pictogramLabel: "desayuno", type: "del_estudiante", startOffsetMin: -160, endOffsetMin: -140, status: "completed" },
    { title: "Fisioterapia", pictogramLabel: "fisioterapia", type: "profesional", startOffsetMin: -20, endOffsetMin: 40, status: "pending" },
    { title: "Comedor", pictogramLabel: "comedor", type: "del_estudiante", startOffsetMin: 90, endOffsetMin: 150, status: "pending" },
    { title: "Recreo", pictogramLabel: "recreo", type: "del_estudiante", startOffsetMin: 160, endOffsetMin: 190, status: "pending" },
    { title: "Ir a casa", pictogramLabel: "casa", type: "familiar", startOffsetMin: 200, endOffsetMin: 230, status: "pending" },
  ],
  sara: [
    { title: "Entrar a clase", pictogramLabel: "entrar a clase", type: "academica", startOffsetMin: -200, endOffsetMin: -170, status: "completed" },
    { title: "Matemáticas", pictogramLabel: "matemáticas", type: "academica", startOffsetMin: -165, endOffsetMin: -120, status: "completed" },
    { title: "Desayuno", pictogramLabel: "desayuno", type: "del_estudiante", startOffsetMin: -110, endOffsetMin: -90, status: "completed" },
    { title: "Lengua", pictogramLabel: "lengua", type: "academica", startOffsetMin: -85, endOffsetMin: -40, status: "completed" },
    { title: "Recreo", pictogramLabel: "recreo", type: "del_estudiante", startOffsetMin: -5, endOffsetMin: 25, status: "in_progress", startedOffsetMin: -3 },
    { title: "Terapia ocupacional", pictogramLabel: "terapia ocupacional", type: "profesional", startOffsetMin: 40, endOffsetMin: 100, status: "pending" },
    { title: "Comedor", pictogramLabel: "comedor", type: "del_estudiante", startOffsetMin: 110, endOffsetMin: 170, status: "pending" },
    { title: "Ir a casa", pictogramLabel: "casa", type: "familiar", startOffsetMin: 180, endOffsetMin: 210, status: "pending" },
  ],
  mateo: [
    { title: "Entrar a clase", pictogramLabel: "entrar a clase", type: "academica", startOffsetMin: -200, endOffsetMin: -170, status: "completed" },
    { title: "Matemáticas", pictogramLabel: "matemáticas", type: "academica", startOffsetMin: -165, endOffsetMin: -120, status: "completed" },
    { title: "Desayuno", pictogramLabel: "desayuno", type: "del_estudiante", startOffsetMin: -110, endOffsetMin: -90, status: "completed" },
    { title: "Taller de plástica", pictogramLabel: "plástica", type: "academica", startOffsetMin: -10, endOffsetMin: 50, status: "in_progress", startedOffsetMin: -8 },
    { title: "Comedor", pictogramLabel: "comedor", type: "del_estudiante", startOffsetMin: 90, endOffsetMin: 150, status: "pending" },
    { title: "Recreo", pictogramLabel: "recreo", type: "del_estudiante", startOffsetMin: 160, endOffsetMin: 190, status: "pending" },
    { title: "Ir a casa", pictogramLabel: "casa", type: "familiar", startOffsetMin: 200, endOffsetMin: 230, status: "pending" },
  ],
};

const MOODS_TODAY: Record<
  string,
  "feliz" | "tranquila" | "cansada" | "nerviosa" | undefined
> = {
  lucia: "feliz",
  daniel: "tranquila",
  aitana: "cansada",
  hugo: undefined,
  sara: "feliz",
  mateo: "nerviosa",
};

const THIRD_SLOT_BY_WEEKDAY: { pictogramLabel: string; title: string }[] = [
  { pictogramLabel: "cocinar", title: "Taller de cocina" },
  { pictogramLabel: "matemáticas", title: "Matemáticas" },
  { pictogramLabel: "música", title: "Música" },
  { pictogramLabel: "comunicación", title: "Comunicación" },
  { pictogramLabel: "leer", title: "Lectura" },
];

const MIN = 60 * 1000;

function hhmm(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function ymd(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const insertWorld = internalMutation({
  args: {
    tutorUserId: v.id("users"),
    students: v.array(
      v.object({ key: v.string(), name: v.string(), userId: v.id("users") }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const classroomId = await ctx.db.insert("classrooms", {
      name: "Aula 3",
      schoolName: "CEIP GuiaMe",
    });

    await ctx.db.insert("tutorProfiles", {
      userId: args.tutorUserId,
      role: "tutor",
      displayName: TUTOR.name,
      classroomIds: [classroomId],
    });

    const pictogramIdByLabel = new Map<string, Id<"pictograms">>();
    for (const p of PICTOGRAMS) {
      const id = await ctx.db.insert("pictograms", {
        label: p.label,
        keywords: p.keywords,
        category: p.category,
        imageUrl: p.imageUrl,
        arasaacId: p.arasaacId,
      });
      pictogramIdByLabel.set(p.label, id);
    }

    function pic(label: string): Id<"pictograms"> {
      const id = pictogramIdByLabel.get(label);
      if (id === undefined) throw new Error(`Missing seed pictogram: ${label}`);
      return id;
    }

    const studentProfileIdByKey = new Map<string, Id<"studentProfiles">>();
    for (const s of args.students) {
      const studentProfileId = await ctx.db.insert("studentProfiles", {
        userId: s.userId,
        classroomId,
        displayName: s.name,
      });
      studentProfileIdByKey.set(s.key, studentProfileId);
      await ctx.db.insert("displaySettings", {
        studentProfileId,
        theme: "crema",
        fontSize: "normal",
        visualSupport: "pictograma_y_texto",
        updatedBy: "tutor",
        updatedAt: Date.now(),
      });
    }

    async function insertActivity(opts: {
      studentProfileId: Id<"studentProfiles">;
      studentName: string;
      title: string;
      type: ActivityType;
      pictogramLabel: string;
      date: string;
      startTime: string;
      endTime: string;
      status: AssignmentStatus;
      startedAtMs?: number;
      completedAtMs?: number;
    }) {
      const activityId = await ctx.db.insert("activities", {
        classroomId,
        title: opts.title,
        description: `${opts.title} de ${opts.studentName}.`,
        type: opts.type,
        date: opts.date,
        startTime: opts.startTime,
        endTime: opts.endTime,
        pictogramId: pic(opts.pictogramLabel),
        createdBy: args.tutorUserId,
        createdAt: Date.now(),
      });

      const assignmentDoc: {
        activityId: Id<"activities">;
        studentProfileId: Id<"studentProfiles">;
        classroomId: Id<"classrooms">;
        date: string;
        startTime: string;
        endTime: string;
        status: AssignmentStatus;
        startedAt?: number;
        completedAt?: number;
      } = {
        activityId,
        studentProfileId: opts.studentProfileId,
        classroomId,
        date: opts.date,
        startTime: opts.startTime,
        endTime: opts.endTime,
        status: opts.status,
      };
      if (opts.startedAtMs !== undefined) assignmentDoc.startedAt = opts.startedAtMs;
      if (opts.completedAtMs !== undefined) assignmentDoc.completedAt = opts.completedAtMs;
      await ctx.db.insert("activityAssignments", assignmentDoc);
    }

    const now = Date.now();
    const todayDate = ymd(now);

    // "Today" — a rich, per-student schedule exercising every status, with
    // times relative to `now` so completed/in-progress/late always line up
    // with whatever real moment the app is actually opened at.
    for (const s of args.students) {
      const slots = TODAY_SCHEDULES[s.key] ?? [];
      for (const slot of slots) {
        await insertActivity({
          studentProfileId: studentProfileIdByKey.get(s.key)!,
          studentName: s.name,
          title: slot.title,
          type: slot.type,
          pictogramLabel: slot.pictogramLabel,
          date: todayDate,
          startTime: hhmm(now + slot.startOffsetMin * MIN),
          endTime: hhmm(now + slot.endOffsetMin * MIN),
          status: slot.status,
          startedAtMs: slot.startedOffsetMin !== undefined ? now + slot.startedOffsetMin * MIN : undefined,
          completedAtMs: slot.status === "completed" ? now + slot.endOffsetMin * MIN : undefined,
        });
      }

      const mood = MOODS_TODAY[s.key];
      if (mood !== undefined) {
        await ctx.db.insert("moodEntries", {
          studentProfileId: studentProfileIdByKey.get(s.key)!,
          classroomId,
          date: todayDate,
          mood,
          recordedAt: now - 3 * 60 * MIN,
        });
      }
    }

    // Rest of the current Mon–Fri week (past days completed, future days
    // pending) for "Mi semana" / "Semana y horario", skipping today since
    // it already has its rich schedule above.
    const dayOfWeek = new Date(now).getDay(); // 0=Sun..6=Sat
    const mondayOffsetDays = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayMs = now + mondayOffsetDays * 24 * 60 * MIN;
    const weekdayDates = new Set<string>();

    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
      const dayMs = mondayMs + dayIndex * 24 * 60 * MIN;
      const dateStr = ymd(dayMs);
      weekdayDates.add(dateStr);
      if (dateStr === todayDate) continue;

      const dayStart = new Date(dayMs);
      dayStart.setHours(0, 0, 0, 0);
      const dayStartMs = dayStart.getTime();
      const isPast = dateStr < todayDate;
      const third = THIRD_SLOT_BY_WEEKDAY[dayIndex];

      const slots: { h: number; m: number; durMin: number; pictogramLabel: string; type: ActivityType; title: string }[] = [
        { h: 9, m: 0, durMin: 30, pictogramLabel: "entrar a clase", type: "academica", title: "Entrar a clase" },
        { h: 11, m: 0, durMin: 15, pictogramLabel: "descanso", type: "del_estudiante", title: "Descanso" },
        { h: 11, m: 30, durMin: 60, pictogramLabel: third.pictogramLabel, type: "academica", title: third.title },
        { h: 14, m: 0, durMin: 60, pictogramLabel: "comedor", type: "del_estudiante", title: "Comedor" },
        { h: 16, m: 0, durMin: 15, pictogramLabel: "autobús", type: "familiar", title: "Autobús" },
      ];

      for (const s of args.students) {
        for (const slot of slots) {
          const startMs = dayStartMs + (slot.h * 60 + slot.m) * MIN;
          const endMs = startMs + slot.durMin * MIN;
          await insertActivity({
            studentProfileId: studentProfileIdByKey.get(s.key)!,
            studentName: s.name,
            title: slot.title,
            type: slot.type,
            pictogramLabel: slot.pictogramLabel,
            date: dateStr,
            startTime: hhmm(startMs),
            endTime: hhmm(endMs),
            status: isPast ? "completed" : "pending",
            completedAtMs: isPast ? endMs : undefined,
          });
        }
      }
    }

    // A guaranteed fully-completed past day for "Historial", independent of
    // where `now` falls in the current week.
    const yesterdayMs = now - 24 * 60 * MIN;
    const yesterdayDate = ymd(yesterdayMs);
    if (yesterdayDate < todayDate && !weekdayDates.has(yesterdayDate)) {
      const dayStart = new Date(yesterdayMs);
      dayStart.setHours(0, 0, 0, 0);
      const dayStartMs = dayStart.getTime();
      const slots: { h: number; m: number; durMin: number; pictogramLabel: string; type: ActivityType; title: string }[] = [
        { h: 9, m: 0, durMin: 30, pictogramLabel: "entrar a clase", type: "academica", title: "Entrar a clase" },
        { h: 9, m: 30, durMin: 50, pictogramLabel: "matemáticas", type: "academica", title: "Matemáticas" },
        { h: 11, m: 0, durMin: 15, pictogramLabel: "descanso", type: "del_estudiante", title: "Descanso" },
        { h: 14, m: 0, durMin: 60, pictogramLabel: "comedor", type: "del_estudiante", title: "Comedor" },
        { h: 16, m: 0, durMin: 15, pictogramLabel: "autobús", type: "familiar", title: "Autobús" },
      ];
      for (const s of args.students) {
        for (const slot of slots) {
          const startMs = dayStartMs + (slot.h * 60 + slot.m) * MIN;
          const endMs = startMs + slot.durMin * MIN;
          await insertActivity({
            studentProfileId: studentProfileIdByKey.get(s.key)!,
            studentName: s.name,
            title: slot.title,
            type: slot.type,
            pictogramLabel: slot.pictogramLabel,
            date: yesterdayDate,
            startTime: hhmm(startMs),
            endTime: hhmm(endMs),
            status: "completed",
            completedAtMs: endMs,
          });
        }
      }
    }

    return null;
  },
});
