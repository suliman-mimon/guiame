# GuiaMe

Agenda digital accesible y personalizable para el alumnado del CEE Fundación
Purísima Concepción (Granada). Proyecto de la asignatura Dirección y Gestión
de Proyectos, Universidad de Granada, curso 2026-2027.

La documentación completa (Propuesta Técnica, Manual de Coordinación) está en
`trabajo/segunda-entrega/`.

## Estado actual

Este repositorio corresponde a la **Iteración 1** del proyecto: base técnica
y autenticación funcionando (RF6.1, RF6.4), y el modelo de datos completo
(RI1-RI3). Las funcionalidades del producto (agenda, actividades, estado
emocional, personalización) se desarrollan en las iteraciones 2 y 3.

## Arquitectura

- **Next.js** (App Router) para la aplicación web, con una única base de
  código para la vista del estudiante y el panel de tutores/administración.
- **Convex** como servidor y base de datos: el esquema y las funciones viven
  en `convex/`, se escriben en TypeScript y se despliegan con el mismo
  comando que empuja a producción.
- **Convex Auth** (proveedor `Password`) para el inicio y cierre de sesión.
  El identificador de acceso acepta tanto un email (tutores/administración)
  como un nombre de usuario simple (estudiantes, según el glosario de la
  Propuesta Técnica) — no se valida formato, solo se compara como texto.
- **Tailwind CSS v4** para los estilos.

Detalle de las tecnologías y su justificación: Propuesta Técnica, apartado
5.c.

### Modelo de datos

El esquema (`convex/schema.ts`) implementa el modelo entidad-relación de la
Propuesta Técnica (apartado 4.f):

| Tabla | Qué guarda |
| --- | --- |
| `users` | Cuenta base (Convex Auth) + `apellidos`, `roles`, `estadoCuenta` |
| `tutores` / `estudiantes` | Perfil específico de cada rol |
| `clases` | Grupos de estudiantes (no un espacio físico) |
| `supervisiones` | Qué tutor supervisa qué clase, por curso académico |
| `matriculas` | Qué estudiante está matriculado en qué clase, por curso |
| `vinculosDirectos` | Tutores (p. ej. familiares) vinculados a un estudiante sin pasar por una clase |
| `imagenes` | Pictogramas e imágenes (origen: ARASAAC) |
| `actividades` / `pasos` | Actividades y sus pasos ordenados |
| `realizaciones` | Una actividad asignada a un estudiante: horario, seguimiento y calificación |
| `estadosEmocionales` | Registro emocional diario por estudiante |
| `configuracionesVisuales` | Paleta, tamaño de letra y apoyo visual por estudiante |

Las funciones de negocio (crear/asignar actividades, comprobar
solapamientos, etc. — RF2.x) son alcance de la iteración 2 y todavía no
están implementadas.

## Instalación y configuración

Requiere Node.js y una cuenta de Convex con acceso al team `guiame-team`
(pedirle acceso a quien administre el proyecto).

```sh
npm install
npx convex dev --configure existing --team guiame-team --project guiame
```

El segundo comando enlaza tu CLI al proyecto `guiame` del team
`guiame-team` y genera `.env.local` (no se sube al repositorio) con las
variables de conexión a tu propio deployment de desarrollo.

## Modo de ejecución

```sh
npm run dev
```

Arranca en paralelo `convex dev` (sincroniza el esquema y las funciones) y
`next dev` (la web en `http://localhost:3000`).

Otros comandos útiles:

```sh
npm run lint        # typecheck + eslint
npm run build       # build de producción de Next.js
npx convex dashboard # abre el dashboard de Convex
```

### Cuentas de acceso

No hay alta pública (RF6.1): las cuentas las crea el administrador (RF6.5,
iteración 3). Mientras tanto, para crear una cuenta de prueba en desarrollo:

```sh
npx convex run accounts:createTutor \
  '{"email":"usuario_o_email","password":"...","nombre":"...","apellidos":"..."}'
```

Añadir `--prod` apunta a producción en vez de a tu deployment de desarrollo
personal.

## Despliegue

- **Vercel**: cada push a `main` dispara un build de producción. El comando
  de build (`vercel.json`) es `npx convex deploy --cmd 'npm run build'`, que
  primero sincroniza `convex/` con el deployment de producción de Convex y
  después compila Next.js ya apuntando a esa URL.
- Un GitHub Action (`.github/workflows/pin-production-alias.yml`) repuntea
  automáticamente el alias **https://guiame-dgp.vercel.app** al deploy que
  acaba de quedar listo.

El Manual de Coordinación (apartado de Control de versiones) fija como
política integrar los cambios mediante Pull Request revisado en vez de
push directo a `main`; `main` ya tiene una regla de protección de rama en
GitHub que lo exige (1 aprobación obligatoria).
