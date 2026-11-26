# GM-49 · Tareas propias del estudiante

## Decisión para revisión

`realizaciones` admite dos formas. Las asignaciones profesionales siguen
exigiendo `asignadoPor` con un ID de tutor. Las propias registran
`origen: "propia"` y el alumno que figura en `estudianteId`. El autor real
se conserva en `actividades.creadoPor`. Los consumidores del calendario
reutilizan la misma tabla y los mismos índices.

Una tabla separada duplicaría la lectura de agenda, estadísticas y comprobación
de solapamientos. Una referencia de usuario genérica exigiría migrar
asignaciones existentes. Hacer opcional el tutor sin un discriminante dejaría
documentos ambiguos. La unión permite verificar ambas formas sin migrar filas.
Suliman y Pablo deben aprobar la unión en `GM-49-modelo-tareas-propias` y el
nuevo requisito de tarea propia, manteniendo RF2.1 para profesionales.

El PR #25 se basa en `main` tras el PR #23. Contiene el modelo del #24,
la mutación y el formulario. La conexión de Hoy con la agenda, Empiezo y
Termino pertenece a GM-29 de Daniele. El flujo completo se conserva en la
rama propia `GM-49-integracion-hoy` para coordinar el montaje del formulario
cuando la agenda de Daniele esté integrada. La revisión de Pablo deja
GM-49 para después de la demo. El formulario usa un bloque de
30 minutos y genera un paso pictográfico con el título de la tarea.
El catálogo necesita registros de `imagenes` con un ID de ARASAAC.
GM-14 proporciona esos datos. La rama de panel conectado también tiene
la carga interna `imagenes:sembrarCatalogo`.

## Pruebas sin servicio

```sh
npm ci
npm run typecheck
npm run lint
bash tests/tareas-alumno.sh
git diff --check
```

Los casos automáticos ejecutan los handlers reales sobre un doble de base
de datos. Verifican argumentos, permisos, datos creados, conflicto horario
con el tutor, cancelaciones, revocación de permisos, lectura de la agenda
y cambios de hora de Madrid. Las tres escrituras se hacen en la misma
mutación. Verifica también la atomicidad y persistencia con Convex real.

## Verificación con Convex local

1. Usa un checkout de desarrollo aislado y comprueba que `.env.local`
   apunta a un backend local (el valor de `NEXT_PUBLIC_CONVEX_URL` debe
   empezar por `http://127.0.0.1:` o `http://localhost:`). Configura
   Convex Auth en ese backend y arranca `npm run dev`.
2. Para P0 usa un checkout con el seed de GM-14 y W2/W3 conectadas. En
   el dashboard de ese deployment vacío configura `GUIAME_DEMO_PASSWORD`
   y ejecuta `npx convex run seed:seedDemoData`. Abre el panel con
   `marta.ruiz@centro-demo.es`, comprueba los seis alumnos de Aula 3 y
   selecciona el 27 de noviembre de 2026 en la agenda. Revisa horas reales
   y cancelaciones. Con una sesión distinta de estudiante, comprueba las
   acciones Empiezo y Termino y su efecto en W2/W3.
3. Para revisar la interfaz completa, usa la rama aislada
   `GM-49-integracion-hoy` con cuentas de demo y el catálogo de pictogramas. En el dashboard local, cambia
   `permiteCrearTareas` en la fila de configuración de Lucía. Si la
   pantalla de ajustes está conectada, puedes usarla con la sesión de Marta.
4. Inicia sesión como `lucia`, abre `/hoy`, pulsa «Nueva tarea» y guarda
   un título, un pictograma y una hora futura libre. Confirma que la vista
   se desplaza al día y franja de esa tarea y que sigue ahí tras recargar.
   En Convex comprueba la actividad, el paso y la realización propia.
5. Intenta ocupar el mismo intervalo y comprueba el mensaje de conflicto.
   Desactiva el permiso y comprueba que el botón desaparece. Usa otra sesión
   de estudiante y verifica que la tarea de Lucía no aparece en su agenda.
