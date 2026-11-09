/** Guías rápidas del modo Examen (se muestran dentro de la aplicación). Admiten **negritas** y `código`. */

export interface GuideSection {
  title: string;
  icon: string;
  body: string;
}

export const TEACHER_GUIDE: GuideSection[] = [
  {
    title: '1. Prepara el examen',
    icon: 'create-outline',
    body:
      'En **Mis exámenes** crea uno nuevo, usa el de ejemplo o **Importar configuración** (.json). En el **Editor** agrega preguntas a mano, del **banco** o con **Captura rápida**: ahí también puedes pegar preguntas de Moodle en formato **GIFT** o **Aiken**.\n\nCada pregunta puede tener **tema** (para ver resultados por tema y repartir preguntas al azar) y una **rúbrica** para calificar a mano (muy útil en programación).',
  },
  {
    title: '2. Abre la sala',
    icon: 'radio-outline',
    body:
      'En **Salas en vivo** elige el examen y cómo se conectan tus alumnos:\n- **Por Internet**: no hay que instalar nada. Usa **Probar conexión** antes de clase; si la red de la escuela bloquea la conexión, configura un servidor **TURN** propio (viaja en el enlace y el QR) o usa la red del aula.\n- **Red del aula**: sin Internet; en tu computadora ejecuta `npm run sala` y comparte la dirección.\n\nComparte el **código**, el **enlace** o el **QR** (botón **Proyectar**). Puedes tener **varias salas abiertas** (por ejemplo un grupo en cada una) con **+ Nueva sala**.',
  },
  {
    title: '3. Durante el examen',
    icon: 'people-outline',
    body:
      'Presiona **Iniciar examen** cuando estén todos y cierra **Aceptar alumnos nuevos** para que nadie más entre. Toca a un alumno para ver sus respuestas en vivo, darle **+5 min**, **tiempo adicional fijo** (adecuaciones, que se puede recordar para próximos exámenes), recoger su examen o reabrirlo.\n\nEnvía **avisos** a toda la sala. Mantén abierta la ventana: tu equipo recibe y califica los exámenes de todas tus salas.',
  },
  {
    title: '4. Si un alumno se desconecta',
    icon: 'refresh-outline',
    body:
      'Su avance no se pierde. Si vuelve a entrar **en el mismo dispositivo con el mismo nombre**, regresa solo a su examen. Si entra **desde otro dispositivo** (o se le borró la sesión), aparece una tarjeta naranja: **Autorizar** (sigue su examen con sus respuestas y su tiempo), **Es otro alumno** o **Rechazar**.\n\nSi recargas tu página, las salas se reabren solas; si alguna dice «Sin reabrir», presiona **Reabrir sala**.',
  },
  {
    title: '5. Cierra y califica',
    icon: 'checkmark-done-outline',
    body:
      '**Cerrar examen** recoge y califica lo pendiente y (si está activado) descarga un **respaldo**. Con **Revisar y calificar** recorres a cada alumno con **Anterior / Siguiente**: ajusta puntos (0, la mitad, completa o por **rúbrica**) y deja **comentarios** que el alumno ve con su resultado. Puedes seguir calificando después de cerrar o archivar la sala.\n\nLa tarjeta **Código parecido entre alumnos** marca respuestas de programación muy similares para revisarlas.',
  },
  {
    title: '6. Exporta y guarda',
    icon: 'download-outline',
    body:
      'En **Resultados**: **Preguntas y respuestas (TXT)** para leer o imprimir, **Concentrado** y **Respuestas** en CSV, **Calificaciones para Moodle/Classroom**, reporte HTML imprimible y **Respaldo** (.json), que se puede volver a **Importar respaldo** en cualquier equipo.\n\nSi usas una computadora compartida, pon una **contraseña** al modo Maestro: tus exámenes y resultados se guardan cifrados.',
  },
];

export const STUDENT_GUIDE: GuideSection[] = [
  {
    title: '1. Entra a la sala',
    icon: 'log-in-outline',
    body: 'Abre el enlace o escanea el QR que te dio tu maestro, o entra a **Examen → Soy alumno** y escribe el **código de la sala** y tu **nombre completo** (escríbelo siempre igual). Espera a que el maestro inicie y presiona **Comenzar examen**.',
  },
  {
    title: '2. Durante el examen',
    icon: 'school-outline',
    body: 'El examen se abre en **pantalla completa**. No cambies de ventana ni de pestaña: tu maestro recibe un aviso. Tus respuestas se **guardan solas** en tu dispositivo, aunque se pierda la conexión; arriba ves si ya se enviaron («guardado ✓»).',
  },
  {
    title: '3. Si se cierra la página o se cae la conexión',
    icon: 'refresh-outline',
    body: 'No pasa nada: tu avance y tu tiempo se conservan. La aplicación se reconecta sola; también puedes presionar **Reintentar**. Si se cerró, vuelve a abrir el enlace o entra con el **mismo nombre en el mismo dispositivo** y regresarás a tu examen.\n\nSi tienes que usar **otro dispositivo**, entra con tu mismo nombre: verás «Esperando autorización» hasta que tu maestro confirme que eres tú.',
  },
  {
    title: '4. Entrega y repasa',
    icon: 'ribbon-outline',
    body: 'Presiona **Terminar examen** y confirma. Según lo que permita tu maestro verás tu calificación, el resultado de cada pregunta, sus **comentarios** y tus resultados por tema. En los temas débiles, **Practicar** abre una práctica de ese tema para repasar.',
  },
];
