# Correcciones de la Propuesta Técnica para el Sprint 2

Base consultada, **Propuesta Técnica de la Iteración 1**, apartados 4.c
(Requisitos funcionales), 4.f (Información), 5.c (Arquitectura) y 5.d
(Iteraciones y cronograma). El plan de Yusuf del 22 de noviembre aporta los
cambios del sprint. Este anexo deja el texto preparado para incorporar a la
siguiente versión editable de la entrega académica.

| Apartado y requisito | Texto propuesto |
| --- | --- |
| 5.c · Arquitectura | La aplicación web usa Next.js 16 (App Router), React 19, TypeScript y Tailwind CSS. Convex almacena datos y ejecuta consultas y mutaciones. Convex Auth gestiona sesiones y Vercel aloja la aplicación web. Mantener Supabase en el apartado 2 como experiencia previa y en 5.c como alternativa comparada. |
| 4.c · RF6.1, RF6.2 y RF6.3 | El usuario accede con su identificador y contraseña mediante Convex Auth. Las funciones de Convex obtienen la identidad de la sesión y comprueban rol y acceso al alumno. El tutor consulta los alumnos de sus clases matriculados en el curso correspondiente y los que tiene vinculados directamente. Las cuentas de demostración se provisionan en una operación interna. |
| 4.c · RF5.1 y RF5.2 | El tutor ve el progreso diario y el historial por fechas. Una realización no iniciada va con retraso después del inicio previsto. Una empezada va con retraso después del fin previsto. El panel muestra las horas reales disponibles y excluye los elementos cancelados del progreso ordinario. Los límites del día se interpretan en Europe/Madrid. |
| 4.c · RF4.1–RF4.3 | El tutor puede elegir paleta, tamaño de texto y activar por separado pictograma, texto, audio y vídeo. Debe quedar habilitado el texto o el pictograma. La comprobación de los estilos, formatos y contraste se realiza también en la interfaz de la tablet. |
| 4.c · RF2.1 y nuevo requisito GM-49 | Conservar RF2.1 para la creación y asignación profesional. Añadir un requisito de tarea propia: el estudiante autenticado, con permiso del tutor, puede crear para sí mismo una tarea con título, pictograma y horario sin solapamientos. El servidor obtiene el destinatario de la sesión y registra al estudiante como autor. Aplicar tras aprobación de Suliman y Pablo. |
| 4.f · RI2.2 | La realización enlaza actividad, estudiante, horario y seguimiento. En una asignación profesional se registra el tutor asignador. Una tarea propia se identifica por su origen y por el alumno de la realización. Mantener la compatibilidad con las asignaciones existentes. |
| 4.c · RF7.1, RF7.2 y RF7.3 | El administrador podrá crear clases, matricular estudiantes y asignar tutores por curso académico. Las tablas `clases`, `matriculas` y `supervisiones` soportan esas relaciones. Los flujos administrativos completos siguen pendientes. |
| 5.d · Cronograma e hitos | Para el Sprint 2, priorizar agenda de tablet y seguimiento del tutor. Registrar GM-49 como cambio de alcance propuesto y diferenciar evidencia de pruebas, integración y validación por el CEE. Mantener RF7 en el alcance administrativo previsto en la Iteración 3. |

Conviene trasladar a la tabla de requisitos y al cronograma únicamente los
cambios aprobados. La priorización de la agenda y el permiso de tareas propias
proceden del feedback de la profesora. La validación con el centro se registra
aparte tras la revisión de la aplicación.
