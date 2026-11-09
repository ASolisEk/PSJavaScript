/**
 * Stores del modo Maestro y del alumno (con React Native, AsyncStorage y expo-crypto
 * simulados en `tests/setup`). Usan el transporte «Este dispositivo» (BroadcastChannel,
 * que también existe en Node), así que maestro y alumno se comunican de verdad.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sampleExam } from '../src/core/exam/config';
import { createRoom, RoomState } from '../src/core/exam/room';
import { MAX_OPEN_ROOMS, roomKey, useTeacher } from '../src/store/teacher';
import { useStudent } from '../src/store/student';

const storage = (AsyncStorage as any).data as Map<string, string>;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Espera a que se cumpla una condición (los mensajes entre maestro y alumno son asíncronos). */
async function until(cond: () => boolean, what: string, ms = 5000) {
  const end = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > end) throw new Error(`No se cumplió a tiempo: ${what}`);
    await sleep(25);
  }
}
const DEVICE = { kind: 'device' } as const;
const room = (key: string): RoomState => useTeacher.getState().rooms.find((r) => roomKey(r) === key)!;

async function freshTeacher() {
  await useTeacher.getState().hydrate();
  for (const r of useTeacher.getState().rooms) useTeacher.getState().leaveRoom(roomKey(r));
  if (!useTeacher.getState().exams.length) useTeacher.getState().newExam(true);
  return useTeacher.getState().exams[0];
}

/** El alumno sale y se borra todo lo que guardó (como si usara otro dispositivo). */
async function newDevice() {
  useStudent.getState().leave();
  await sleep(400);
  storage.delete('psjs.student.v1');
  storage.delete('psjs.student.ids.v1');
}

test('maestro: varias salas abiertas a la vez, independientes y con límite', async () => {
  const exam = await freshTeacher();
  const T = useTeacher.getState();
  assert.ok(await T.openRoom(exam.id, DEVICE));
  assert.ok(await T.openRoom(exam.id, DEVICE));
  const rooms = useTeacher.getState().rooms;
  assert.equal(rooms.length, 2);
  assert.notEqual(rooms[0].code, rooms[1].code);
  assert.equal(useTeacher.getState().liveKeys.length, 2);
  // la más reciente queda a la vista
  assert.equal(useTeacher.getState().activeKey, roomKey(rooms[0]));
  // cada sala se guarda por separado, con un índice
  await sleep(50);
  assert.equal(JSON.parse(storage.get('psjs.teacher.rooms.v2')!).length, 2);
  for (const r of rooms) assert.ok(storage.has(`psjs.teacher.rooms.v2:${roomKey(r)}`));

  // iniciar una no afecta a la otra
  const [a, b] = rooms.map(roomKey);
  T.startExam(a);
  assert.equal(room(a).status, 'running');
  assert.equal(room(b).status, 'lobby');

  // límite de salas abiertas
  while (useTeacher.getState().rooms.length < MAX_OPEN_ROOMS) assert.ok(await T.openRoom(exam.id, DEVICE));
  assert.equal(await T.openRoom(exam.id, DEVICE), false);
  assert.match(useTeacher.getState().openError ?? '', /salas abiertas/);

  // descartar salas sin cerrar no las manda al historial
  const before = useTeacher.getState().history.length;
  for (const r of useTeacher.getState().rooms) T.leaveRoom(roomKey(r));
  assert.equal(useTeacher.getState().rooms.length, 0);
  assert.equal(useTeacher.getState().history.length, before);
  assert.equal(useTeacher.getState().activeKey, null);
});

test('alumno y maestro: entrega, cierre, calificación a mano y archivo al historial', async () => {
  const exam = await freshTeacher();
  const T = useTeacher.getState();
  assert.ok(await T.openRoom(exam.id, DEVICE));
  const r0 = useTeacher.getState().rooms[0];
  const key = roomKey(r0);
  T.startExam(key);

  const S = useStudent.getState();
  await S.hydrate();
  assert.ok(await S.join({ code: r0.code, name: 'Ana Prueba', group: '3A', transport: DEVICE }));
  await until(() => useStudent.getState().session?.phase === 'ready', 'la alumna ve el examen listo');
  useStudent.getState().begin();
  await until(() => useStudent.getState().session?.phase === 'exam', 'la alumna recibe su examen');
  const sess = useStudent.getState().session!;
  assert.equal(sess.phase, 'exam');
  const tf = sess.paper!.questions.find((q) => q.type === 'truefalse')!;
  useStudent.getState().setAnswer(tf.id, true);
  await until(() => !useStudent.getState().pendingSync, 'la respuesta llega al maestro');
  useStudent.getState().submit();
  await until(() => useStudent.getState().session?.phase === 'submitted', 'la alumna recibe su calificación');

  // el dispositivo recuerda su identidad para esa sala
  const ids = JSON.parse(storage.get('psjs.student.ids.v1')!);
  assert.equal(ids[r0.code].identity.name, 'Ana Prueba');

  await until(() => !!Object.values(room(key).students)[0]?.result, 'el maestro tiene la calificación');
  await T.closeExam(key);
  assert.equal(room(key).status, 'closed');
  assert.equal(useTeacher.getState().tab, 'results');
  const st = Object.values(room(key).students)[0];
  assert.ok(st.result);
  const qid = st.key!.questionIds[0];

  // calificar a mano con la sala cerrada
  T.adjust(key, st.id, qid, 0);
  const manual = room(key).students[st.id].result!.questions.find((x) => x.questionId === qid)!;
  assert.equal(manual.manual, true);
  assert.equal(manual.score, 0);

  // archivar: pasa al historial y se puede seguir calificando
  T.leaveRoom(key);
  assert.equal(useTeacher.getState().rooms.length, 0);
  const hist = () => useTeacher.getState().history.find((h) => roomKey(h) === key)!;
  assert.ok(hist());
  T.adjust(key, st.id, qid, null);
  assert.equal(hist().students[st.id].result!.questions.find((x) => x.questionId === qid)!.manual, undefined);
  // se guarda poco después (los clics se agrupan)
  await sleep(1000);
  const saved: RoomState = JSON.parse(storage.get(`psjs.teacher.history.v2:${key}`)!);
  assert.equal(saved.students[st.id].result!.questions.find((x) => x.questionId === qid)!.manual, undefined);

  // respaldo: se puede importar de nuevo al historial
  T.deleteHistory(key);
  assert.equal(T.importHistory(JSON.stringify(saved)), key);
  assert.ok(hist());
  assert.throws(() => T.importHistory('{"hola":1}'), /respaldo/);

  useStudent.getState().leave();
  await sleep(400);
});

test('reconexión con los stores: mismo dispositivo entra directo, otro dispositivo espera autorización', async () => {
  const exam = await freshTeacher();
  const T = useTeacher.getState();
  assert.ok(await T.openRoom(exam.id, DEVICE));
  const r0 = useTeacher.getState().rooms[0];
  const key = roomKey(r0);
  T.startExam(key);
  await newDevice();

  assert.ok(await useStudent.getState().join({ code: r0.code, name: 'Beto Uno', group: '', transport: DEVICE }));
  await until(() => useStudent.getState().session?.phase === 'ready', 'Beto ve el examen listo');
  useStudent.getState().begin();
  await until(() => useStudent.getState().session?.phase === 'exam', 'Beto recibe su examen');
  const first = useStudent.getState().session!;
  const q = first.paper!.questions[0];
  const id1 = first.identity.studentId;
  // ya no se aceptan alumnos nuevos: los que ya entraron sí pueden volver
  T.setLocked(key, true);

  // sale y vuelve en el mismo dispositivo (con el nombre escrito distinto): entra directo
  useStudent.getState().leave();
  await sleep(400);
  assert.ok(await useStudent.getState().join({ code: r0.code, name: 'beto uno', group: '', transport: DEVICE }));
  await until(() => useStudent.getState().session?.phase === 'exam', 'Beto vuelve a su examen');
  assert.equal(useStudent.getState().session!.identity.studentId, id1);

  // otro dispositivo: espera a que el maestro lo autorice (aunque el ingreso esté cerrado)
  await newDevice();
  assert.ok(await useStudent.getState().join({ code: r0.code, name: 'Beto Uno', group: '', transport: DEVICE }));
  await until(() => !!useStudent.getState().session?.pendingApproval, 'Beto espera autorización');
  await until(() => !!room(key).requests?.length, 'el maestro ve la solicitud');
  assert.equal(useStudent.getState().session!.paper, null);
  const req = room(key).requests![0];
  assert.equal(req.targetId, id1);
  T.approveReconnect(key, req.id);
  await until(() => useStudent.getState().session?.phase === 'exam' && !useStudent.getState().session?.pendingApproval, 'Beto sigue su examen');
  const s2 = useStudent.getState().session!;
  assert.equal(s2.pendingApproval, null);
  assert.equal(s2.phase, 'exam');
  assert.equal(s2.paper!.questions[0].id, q.id, 'el mismo examen');
  assert.ok(room(key).students[s2.identity.studentId]);
  assert.equal(room(key).students[id1], undefined);

  useStudent.getState().leave();
  await sleep(400);
  T.leaveRoom(key);
});

test('maestro: la sala de la versión anterior se migra y se reabre al iniciar', async () => {
  await freshTeacher();
  const legacy = createRoom('OLD777', sampleExam(), DEVICE);
  storage.set('psjs.teacher.room.v1', JSON.stringify(legacy));
  useTeacher.setState({ hydrated: false, rooms: [], liveKeys: [], activeKey: null });
  await useTeacher.getState().hydrate();
  assert.ok(useTeacher.getState().rooms.some((r) => r.code === 'OLD777'));
  assert.equal(storage.has('psjs.teacher.room.v1'), false, 'la clave anterior se borra');
  assert.ok(storage.get('psjs.teacher.rooms.v2')!.includes('OLD777'));
  await useTeacher.getState().reopenAll();
  assert.ok(useTeacher.getState().liveKeys.includes(roomKey(legacy)));
  useTeacher.getState().leaveRoom(roomKey(legacy));
});
