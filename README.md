# GuiaMe

Agenda digital accesible y personalizable para el alumnado del CEE Fundación
Purísima Concepción (Granada). Proyecto de la asignatura Dirección y Gestión
de Proyectos, Universidad de Granada, curso 2026-2027.

## Estado actual

Versión entregada al final del Sprint 2 (27 de noviembre de 2026). En `main`:

- **Acceso**: login único con el diseño de Figma (GM-27) y redirección por
  rol (GM-06): el alumnado va a `/hoy` y los profesionales a `/panel`.
- **Panel del profesional**: «Mis estudiantes» con el progreso del día, qué
  hace cada uno y los retrasos, con filtros (GM-15, GM-21, GM-26); la agenda
  de cada estudiante en tiempo real (GM-16, GM-22); el asistente «Nueva
  actividad» con pasos, pictogramas de ARASAAC y aviso de solapamientos
  (GM-07, GM-23 a GM-25, GM-47); y los ajustes de paleta, letra y formatos
  de cada alumno (GM-34 a GM-36).
- **App del alumno**: «Hoy» con Empiezo y Termino, la vista paso a paso,
  «¡Muy bien!» y «Mi semana», con la paleta y la letra que elige el tutor
  (GM-28 a GM-32, GM-35).
- **Datos de demostración** listos con dos comandos (ver más abajo).

Queda para la iteración 3: el estado de ánimo del alumno (PR #30), sus
tareas propias (PR #24 y #25), los permisos del alumno en Ajustes (PR #31,
pendiente de revisión), editar una actividad desde el panel y subir vídeo o
audio a los pasos (el servidor ya los admite: GM-11 y GM-12).

La Propuesta Técnica y el Manual de Coordinación se mantienen en la entrega
académica del equipo. El
[anexo de correcciones](docs/correcciones-propuesta-tecnica-sprint-2.md)
contiene los textos propuestos para la siguiente versión de la Propuesta Técnica.

## Arquitectura

- **Next.js 16 y React 19** (App Router) para la aplicación web, con una única base de
  código para la vista del estudiante y el panel de tutores/administración.
- **Convex** como servidor y base de datos: el esquema y las funciones viven
  en `convex/`, se escriben en TypeScript y se despliegan con el mismo
  comando que empuja a producción.
- **Convex Auth** (proveedor `Password`) para el inicio y cierre de sesión.
  El identificador de acceso acepta tanto un email (tutores/administración)
  como un nombre de usuario simple (estudiantes, según el glosario de la
  Propuesta Técnica) — no se valida formato, solo se compara como texto.
- **Tailwind CSS v4** para los estilos.
- **Vercel** para la aplicación web y las previews de revisión.

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

La gestión administrativa de clases (RF7.1–RF7.3) requiere pantallas y
operaciones de creación, matrícula y asignación de tutores. Las tablas
anteriores son la base de datos para esas funciones.

### Directorios

| Ruta | Contenido |
| --- | --- |
| `src/app/` | Rutas, layouts y estilos globales de Next.js |
| `src/components/` | Componentes compartidos y proveedor de Convex |
| `convex/` | Esquema, autenticación y funciones de servidor |
| `convex/_generated/` | Tipos y referencias de API generados por Convex |
| `.github/workflows/` | Automatización del repositorio |

## Instalación y configuración

Usa Node.js 24 y npm. Para configurar un deployment de desarrollo del equipo
necesitas acceso al team `guiame-team`.

```sh
npm ci
npx convex dev --configure existing --team guiame-team --project guiame
```

El segundo comando enlaza tu CLI al proyecto `guiame` del team
`guiame-team` y genera `.env.local` (no se sube al repositorio) con las
variables de conexión a tu propio deployment de desarrollo. Comprueba
`CONVEX_DEPLOYMENT` para la CLI y `NEXT_PUBLIC_CONVEX_URL` para el cliente
web. Convex proporciona `CONVEX_SITE_URL`, que se usa como emisor de Convex
Auth. Configura Convex Auth en el deployment de desarrollo. Debe tener `SITE_URL`
con el origen de la web y el par `JWT_PRIVATE_KEY` / `JWKS`. La clave privada
se guarda únicamente en Convex. Para un entorno local, usa
`http://localhost:3000` como `SITE_URL`. Conserva `.env.local` fuera de Git.

## Modo de ejecución

```sh
npm run dev
```

Arranca en paralelo `convex dev` (sincroniza el esquema y las funciones) y
`next dev` (la web en `http://localhost:3000`).

Otros comandos útiles:

```sh
npm run typecheck   # tipos de Convex y Next.js
npm run lint        # typecheck + eslint
git diff --check    # espacios sobrantes y marcadores de conflicto
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

### Datos de demostración

En un deployment de desarrollo vacío, dos pasos, en este orden:

```sh
npx convex run seed:seedDemoData   # una sola vez: cuentas, clase y emociones
npx convex run demo:prepararDia    # antes de cada demo o ensayo
```

- `seed:seedDemoData` crea una tutora, 4 estudiantes, una clase ("Aula 3")
  con sus matrículas y el catálogo de 6 emociones. Solo se ejecuta una vez
  por deployment, porque las cuentas no se pueden crear dos veces.
- `demo:prepararDia` carga el catálogo de pictogramas de ARASAAC y deja la
  agenda de hoy como la de un día real de cole. Hay actividades hechas, una
  en curso, un retraso de Pablo en Logopedia y un hueco libre en la agenda
  de Lucía para crear una actividad en directo. Las horas se calculan desde
  el momento en que se ejecuta, así que hay que lanzarlo justo antes de la
  demo. Se puede repetir: cancela lo que hubiera en las 12 horas de antes y
  de después, y vuelve a crear el día.

Con `--prod` al final, los dos comandos van contra producción. Las previews
de Vercel hacen los dos pasos solas (`demo:sembrarTodo`, con `--preview-run`
en `vercel.json`), porque cada una nace con su propio deployment de Convex
vacío.

| Cuenta | Usuario | Contraseña |
| --- | --- | --- |
| Tutora | `marta.ruiz@centro-demo.es` | `Demo1234!` |
| Estudiantes | `lucia`, `pablo`, `ana`, `javier` | `Demo1234!` |

Las actividades y los estados emocionales son contenido de ejemplo
provisional; se sustituyen cuando llegue el contenido real de Ignacio sin
tocar la estructura del seed.

## Despliegue

- **Vercel**: cada push a `main` dispara un build de producción. El comando
  de build (`vercel.json`) es `npx convex deploy --cmd 'npm run build'`, que
  primero sincroniza `convex/` con el deployment de producción de Convex y
  después compila Next.js ya apuntando a esa URL.
- Un GitHub Action (`.github/workflows/pin-production-alias.yml`) repuntea
  automáticamente el alias **https://guiame-dgp.vercel.app** al deploy que
  acaba de quedar listo.

## Ramas y revisión

Crea una rama por tarea con su identificador, por ejemplo `GM-15-listar-estudiantes`.
El Pull Request explica los cambios, las pruebas y sus dependencias. Si depende
de un PR abierto, usa la rama de ese PR como base hasta que se integre. Solicita
revisión a Pablo y, para los cambios de backend, a Suliman. La integración en
`main` se realiza desde GitHub después de la revisión.
