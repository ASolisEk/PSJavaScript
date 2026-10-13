import assert from 'node:assert/strict';
import test from 'node:test';
import { COSTUMES, costumeForDate, costumeWindow, resolveCostume } from '../src/core/holidays';

const on = (y: number, m: number, d: number) => costumeForDate(new Date(y, m - 1, d))?.id ?? null;
const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
const win = (id: string, year: number) => {
  const w = costumeWindow(COSTUMES.find((c) => c.id === id)!, year);
  return `${fmt(w.start)}-${fmt(w.end)}`;
};

test('holidays: un mes antes y 10 días después del día festivo', () => {
  assert.equal(win('halloween', 2026), '9/30-11/10');
  assert.equal(win('navidad', 2026), '11/25-1/4');
  assert.equal(win('san-valentin', 2027), '1/14-2/24');
  assert.equal(win('primavera', 2027), '2/21-3/31');
  assert.equal(win('dia-del-nino', 2027), '3/30-5/10');
  assert.equal(win('independencia', 2026), '8/16-9/26');
});

test('holidays: solo 10 días antes si otra fiesta cae en el mismo mes', () => {
  assert.equal(win('muertos', 2026), '10/23-11/12'); // noviembre: Muertos y Revolución
  assert.equal(win('revolucion', 2026), '11/10-11/30');
  assert.equal(win('anio-nuevo', 2027), '12/22-1/11'); // enero: Año Nuevo y Reyes
  assert.equal(win('reyes', 2027), '12/27-1/16');
  assert.equal(win('dia-de-las-madres', 2027), '4/30-5/20'); // mayo: Madres y Maestro
  assert.equal(win('dia-del-maestro', 2027), '5/5-5/25');
});

test('holidays: vestuario automático por fecha', () => {
  assert.equal(on(2026, 9, 29), null);
  assert.equal(on(2026, 9, 30), 'halloween');
  assert.equal(on(2026, 10, 12), 'halloween');
  assert.equal(on(2026, 10, 31), 'halloween');
  assert.equal(on(2026, 12, 1), 'navidad');
  assert.equal(on(2026, 12, 24), 'navidad');
  assert.equal(on(2027, 1, 20), 'san-valentin');
  assert.equal(on(2027, 2, 25), 'primavera');
  assert.equal(on(2027, 4, 15), 'dia-del-nino');
  assert.equal(on(2027, 5, 25), 'dia-del-maestro');
  assert.equal(on(2027, 5, 26), null);
  assert.equal(on(2027, 8, 15), null);
  assert.equal(on(2027, 8, 16), 'independencia');
  assert.equal(on(2026, 9, 26), 'independencia');
});

test('holidays: si se enciman gana la fiesta más cercana (en empate, la que viene)', () => {
  assert.equal(on(2026, 10, 25), 'halloween'); // faltan 6 vs 8 para Muertos
  assert.equal(on(2026, 11, 1), 'muertos'); // empate: 1 día después de Halloween, 1 antes de Muertos
  assert.equal(on(2026, 11, 10), 'muertos'); // 8 días después vs 10 antes de Revolución
  assert.equal(on(2026, 11, 11), 'revolucion'); // empate 9 / 9
  assert.equal(on(2026, 11, 28), 'revolucion'); // 8 después vs 27 antes de Navidad
  assert.equal(on(2026, 12, 28), 'navidad'); // 3 después vs 4 antes de Año Nuevo
  assert.equal(on(2026, 12, 29), 'anio-nuevo');
  assert.equal(on(2027, 1, 3), 'anio-nuevo');
  assert.equal(on(2027, 1, 4), 'reyes');
  assert.equal(on(2027, 5, 12), 'dia-de-las-madres');
  assert.equal(on(2027, 5, 13), 'dia-del-maestro');
});

test('holidays: Día del Programador solo el día 256 del año', () => {
  assert.equal(on(2026, 9, 13), 'programador');
  assert.equal(on(2026, 9, 12), 'independencia');
  assert.equal(on(2028, 9, 12), 'programador'); // año bisiesto
  assert.equal(on(2028, 9, 13), 'independencia');
});

test('holidays: preferencia manual', () => {
  const d = new Date(2026, 9, 31);
  assert.equal(resolveCostume('auto', d)?.id, 'halloween');
  assert.equal(resolveCostume(undefined, d)?.id, 'halloween');
  assert.equal(resolveCostume('none', d), null);
  assert.equal(resolveCostume('navidad', d)?.id, 'navidad');
  assert.equal(resolveCostume('no-existe', d), null);
});

test('holidays: pieles de Halloween y Día de Muertos', () => {
  const skin = (id: string) => COSTUMES.find((c) => c.id === id)?.skin;
  assert.equal(skin('halloween'), 'dark');
  assert.equal(skin('muertos'), 'black');
  assert.equal(skin('navidad'), 'normal');
});
