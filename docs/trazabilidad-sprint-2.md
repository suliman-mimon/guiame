# Trazabilidad del Sprint 2

Corte del 26 de noviembre de 2026. Fuente de requisitos: Propuesta Técnica de
la Iteración 1, §4.c y §5.d, y plan de Yusuf del 22 de noviembre. El estado
indica el alcance funcional completo. Comprobar tipos o ejecutar un handler
con datos simulados aporta evidencia parcial. La aceptación del centro
queda para la revisión del sprint. Los PR #13 y #15 aportan backend a
`main`. El PR #23 incorporó a `main` la redirección y configuración del
#7 y #14. El equipo decidió cerrar sin fusionar #17 y #19 y dejar #20
como borrador. Esas decisiones de revisión conservan el código en sus ramas. GM-29
pertenece a Daniele y se revisa por separado. Suliman es responsable
de los cambios estructurales del esquema.

| Requisito | Historia de usuario | Pantalla | Función backend | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- |
| RF1.1 | Alumno consulta su día | Hoy | `realizaciones.miAgenda` | En desarrollo | Backend en main. Hoy en #16. Propuesta local para GM-29, responsabilidad de Daniele, para revisión con cuatro pruebas de handlers en memoria |
| RF1.2 | Alumno consulta su semana | Mi semana | `realizaciones.listarAgenda` | En desarrollo | PR #13 acepta rangos. Falta probar pantalla y permiso |
| RF1.3 | Alumno sigue los pasos | 3a–3c | `realizaciones.obtenerDetalle` | En desarrollo | PR #13 devuelve pasos |
| RF2.1 | Tutor crea una actividad | W4a | `actividades.crear` | En desarrollo | Backend en main. W4 conectado en la rama GM-15-16-panel-conectado |
| RF2.2 | Tutor modifica una actividad y su horario | W3 / W4 | `actividades.modificar`, `realizaciones.reprogramar` | En desarrollo | PR #15 integrado en main. Pendiente prueba del flujo en pantalla |
| RF2.3 | Tutor cancela una asignación | W3 | `realizaciones.cancelar` | En desarrollo | PR #13 cubre la mutación |
| RF2.4 | Tutor elige un pictograma | W4a | `actividades.crear`, catálogo `imagenes` | En desarrollo | GM-14 puebla el catálogo. W4 usa un catálogo de prueba |
| RF2.5 | Tutor asigna una actividad a alumnos | W4c | `realizaciones.asignar` | En desarrollo | Backend en main. W4 real en GM-15-16-panel-conectado, pendiente de validación |
| RF2.6 | Tutor recibe aviso de colisión horaria | W4c | `realizaciones.asignar` | En desarrollo | PR #13 valida intervalos. Pendiente de prueba con el asistente real |
| RF2.7 | Tutor prepara pasos comprensibles | W4b | `actividades.crear` | En desarrollo | PR #13 y pasos en el asistente de prueba |
| RF3.1 | Alumno pulsa Empiezo | Hoy | `realizaciones.empezar` | En desarrollo | PR #13 guarda la hora. GM-29 separado de GM-49. Prueba de handler en memoria; pendiente coordinación con Daniele y Convex real |
| RF3.2 | Alumno pulsa Termino | Hoy | `realizaciones.terminar` | En desarrollo | PR #13 exige inicio y guarda fin. GM-29 separado de GM-49. Prueba de handler en memoria; pendiente coordinación con Daniele y Convex real |
| RF3.3 | Alumno registra cómo se siente ese día | Mi estado de ánimo | Tabla `estadosEmocionales` | En desarrollo | Esquema y catálogo. Falta validar el registro diario |
| RF3.4 | Tutor consulta la emoción registrada | W3 | Tabla `estadosEmocionales` | En desarrollo | Sin consulta conectada a W3 |
| RF4.1 | Tutor elige la paleta | W5 / Hoy | `configuracionesVisuales.obtener/actualizar` | En desarrollo | Backend integrado mediante #23. Pendiente de comprobar el cambio en la tablet |
| RF4.2 | Tutor ajusta el tamaño de letra | W5 / Hoy | `configuracionesVisuales.obtener/actualizar` | En desarrollo | Backend integrado mediante #23. Pendiente de comprobar la pantalla |
| RF4.3 | Tutor configura los formatos | W5 / Hoy | `configuracionesVisuales.obtener/actualizar` | En desarrollo | El backend integrado mediante #23 guarda cuatro formatos y exige texto o pictograma |
| RF5.1 | Tutor consulta pendientes y retrasos | W2 / W3 | `panel.misEstudiantes`, `realizaciones.agendaDeEstudiante` | Implementado, pendiente de pruebas | `tests/panel.sh` en la rama de integración. Estados y retrasos comprobados en memoria. Ramas de #17 y #19 conservadas tras la decisión de cierre |
| RF5.2 | Tutor ve completadas y horas reales | W3 | `realizaciones.agendaDeEstudiante` | Implementado, pendiente de pruebas | La rama de GM-16 conserva horas, duración y navegación por fechas. El equipo pidió cerrar #19 y revisar las dependencias si se retoma |
| RF5.3 | Tutor califica una realización | W3 | Campo de calificación en `realizaciones` | No iniciado | Esquema |
| RF6.1 | Usuario inicia sesión | Login | Convex Auth `signIn` | Implementado, pendiente de pruebas | `src/app/login/page.tsx`. Sin prueba propia de sesión |
| RF6.2 | Usuario accede solo a datos permitidos | Panel / Hoy | `convex/lib/auth.ts` | Implementado, pendiente de pruebas | PR #6 y #13. Pendiente prueba de sesiones reales |
| RF6.3 | Tutor consulta alumnos asignados | W2 | `panel.misEstudiantes` | Implementado, pendiente de pruebas | GM-15 quedó en su rama tras cerrar #17. `tests/panel.sh` cubre tutor, alumno, deduplicación, matrícula y vínculo con datos en memoria |
| RF6.4 | Usuario cierra sesión | Panel / Hoy | Convex Auth `signOut` | Implementado, pendiente de pruebas | `src/components/SignOutButton.tsx`. Sin prueba propia de sesión |
| RF6.5 | Administrador gestiona cuentas | Administración | `accounts.createTutor` (CLI) | En desarrollo | Alta interna del tutor. Falta gestión administrativa completa |
| RF7.1 | Administrador crea una clase | Administración | Tabla `clases` | No iniciado | Esquema y seed. Sin flujo administrativo |
| RF7.2 | Administrador matricula al alumno | Administración | Tabla `matriculas` | No iniciado | Esquema y seed. Sin flujo administrativo |
| RF7.3 | Administrador asigna tutor a una clase | Administración | Tabla `supervisiones` | No iniciado | Esquema y seed. Sin flujo administrativo |
| GM-49, sin RF asignado | Alumno autorizado crea una tarea propia | Hoy | `tareasAlumno.crear`, `configuracionesVisuales.miConfiguracion` | Implementado, pendiente de aprobación y prueba real | 7 pruebas locales con datos en memoria. Modelo en #24, solicitado en borrador; backend y formulario en #25. Aplazado hasta después de la demo por congelación del esquema. El montaje depende de GM-29 |

## Cambios propuestos para la siguiente Propuesta Técnica

- Mantener Supabase como experiencia previa y alternativa comparada (secciones
  2 y 5.c). En la Propuesta de Iteración 1 consultada, la arquitectura figura
  como Next.js, Convex y Vercel. Revisar el cronograma de la entrega siguiente
  con ese stack y documentar el control de acceso de Convex Auth y los helpers.
- Conservar RF2.1 para profesionales y añadir el requisito de tareas propias de
  GM-49 tras la aprobación del modelo y de su alcance.
- Alinear RF4.3 con los cuatro botones independientes y RF3.3 con el registro
  diario. Documentar el rango de 3 o 6 emociones como configuración del tutor.
- Mantener RF7.1–RF7.3 como alcance administrativo pendiente. Registrar el
  feedback de la profesora como tal y reservar la validación del cliente para
  la revisión con el CEE.
