# GuiaMe

Agenda digital accesible y personalizable para el alumnado del CEE Fundación
Purísima Concepción (Granada). Proyecto de la asignatura Dirección y Gestión
de Proyectos, Universidad de Granada, curso 2026-2027.

## Estado actual

La rama principal incluye Convex Auth, la redirección por rol, la configuración
visual, el esquema, el seed base y las operaciones de agenda y seguimiento.
El panel profesional incluye pantallas con datos de prueba. Hoy del alumno
(PR #16), el seed ampliado (PR #20) y las tareas propias (PR #24 y #25)
se revisan por separado. Comprueba qué ramas incluye el entorno antes de
ensayar el recorrido completo.

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

En un deployment de desarrollo vacío, ejecuta:

```sh
npx convex run seed:seedDemoData
```

El seed interno de la base crea una tutora, alumnado ficticio y actividades.
Si estás probando GM-14, configura antes `GUIAME_DEMO_PASSWORD` en Convex
con al menos 12 caracteres. Usa esa contraseña con
`marta.ruiz@centro-demo.es` o con el usuario de uno de los seis alumnos
(`lucia`, `daniel`, `aitana`, `hugo`, `sara`, `mateo`). Las 25 sesiones
de GM-14 están fechadas del 23 al 27 de noviembre de 2026. Para comprobar
W2 y W3 utiliza una rama con las consultas y la interfaz conectadas.

Si el checkout incluye `tests/panel.sh`, ejecútalo con `bash tests/panel.sh`.
La prueba del seed de GM-14 se empaqueta y ejecuta así:

```sh
bundle="$(mktemp --suffix=.cjs)"
./node_modules/.bin/esbuild tests/seed.test.mjs --bundle --platform=node --outfile="$bundle"
node "$bundle"
rm -- "$bundle"
```

En la rama de GM-49, ejecuta `bash tests/tareas-alumno.sh`. Esa rama incluye
`docs/gm-49-validacion.md` con el procedimiento de validación funcional.
La configuración visual ya guarda `permiteCrearTareas`. La creación propia
requiere además el modelo del PR #24 y la mutación y el formulario del #25.

Estas pruebas ejercitan los handlers con una base en memoria. Para verificar
sesión, escritura y reactividad, usa un deployment de desarrollo aparte.

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

Antes de apilar un PR, comprueba si su base sigue activa y qué código llegó
a `main`. El PR #20 conserva su base histórica y Pablo ha pedido dejarlo
en borrador. Pablo indicó que #17 y #19 deben cerrarse sin fusionar y que
sus ramas deben conservarse. Una futura recuperación de la agenda del
tutor exige revisar las funciones que ya están en `main` y coordinar la
integración con el equipo.

GM-17 y GM-18 se revisan contra `main`. Pablo condicionó la aprobación
anterior de GM-17 a la integración del PR #18, que conecta el panel
profesional. La configuración visual y la redirección por rol llegaron a
`main` mediante el PR #23.

Hoy parte del PR #16. Daniele es responsable de GM-29, la conexión con
`realizaciones.miAgenda`, `empezar` y `terminar`. La propuesta local
`GM-29-conexion-convex-hoy` espera coordinación con él. Se comprueba con
`bash tests/agenda-hoy.sh` en ese checkout.

GM-49 queda para después de la demo. El esquema está congelado y Suliman
es responsable de los cambios estructurales. Pablo pidió dejar el modelo
(PR #24) en borrador. El PR #25 conserva la creación autorizada y el
formulario para completar su montaje cuando se aprueben el modelo y GM-29.
