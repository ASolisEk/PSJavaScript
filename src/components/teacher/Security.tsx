/** Contraseña del modo Maestro: pantalla de bloqueo, tarjeta de ajustes y diálogo. */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Text } from '../../ui/text';
import { useTeacher } from '../../store/teacher';
import { confirmDialog } from '../../ui/platform';
import { useTheme } from '../../ui/theme';
import ModalShell from '../modals/ModalShell';
import { Button } from '../ui';
import { Banner, Card, Field, TextField } from '../exam/kit';

const MIN_LENGTH = 4;

/** Campo de contraseña con botón para mostrarla. */
function PasswordField({ value, onChange, placeholder, onSubmit, autoFocus }: { value: string; onChange(v: string): void; placeholder: string; onSubmit?(): void; autoFocus?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <TextField
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        textContentType="password"
        autoFocus={autoFocus}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        style={{ flex: 1 }}
      />
      <Button label={show ? 'Ocultar' : 'Ver'} icon={show ? 'eye-off-outline' : 'eye-outline'} kind="ghost" onPress={() => setShow((v) => !v)} />
    </View>
  );
}

/** Lo que ve cualquiera que abra el modo Maestro protegido sin la contraseña. */
export function LockScreen() {
  const t = useTheme();
  const live = useTeacher((s) => s.live && !!s.room && s.room.status !== 'closed');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    const ok = await useTeacher.getState().unlock(password);
    setBusy(false);
    if (!ok) setError('Contraseña incorrecta.');
    setPassword('');
  };

  const forgot = async () => {
    const ok = await confirmDialog(
      '¿Olvidaste la contraseña?',
      'No hay forma de recuperarla: los exámenes y resultados están cifrados con ella. Puedes borrar TODOS los datos del modo Maestro de este dispositivo (exámenes, historial y sala) y empezar de nuevo. Esta acción no se puede deshacer.',
      'Borrar todo',
    );
    if (ok) await useTeacher.getState().forgetAll();
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled">
      <Card style={{ width: '100%', maxWidth: 440, alignItems: 'stretch' }}>
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.accent + '1f', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Ionicons name="lock-closed" size={30} color={t.accent} />
          </View>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800' }}>Modo Maestro protegido</Text>
          <Text style={{ color: t.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 19 }}>
            Escribe la contraseña para ver, editar o aplicar los exámenes y consultar los resultados.
          </Text>
        </View>
        {live ? <Banner icon="radio-outline" color={t.success} text="La sala sigue abierta y recibiendo exámenes; solo la pantalla está bloqueada." /> : null}
        <PasswordField value={password} onChange={setPassword} placeholder="Contraseña" onSubmit={submit} autoFocus />
        {error ? <Text style={{ color: t.danger, fontSize: 13, marginTop: 8 }}>{error}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 }}>
          <Button label="Desbloquear" icon="lock-open-outline" kind="primary" onPress={submit} disabled={!password || busy} style={{ flex: 1 }} />
          {busy ? <ActivityIndicator color={t.primary} /> : null}
        </View>
        <Button label="Olvidé la contraseña" kind="ghost" size="sm" onPress={forgot} style={{ alignSelf: 'center', marginTop: 10 }} />
      </Card>
    </ScrollView>
  );
}

type Mode = 'set' | 'change' | 'remove';

/** Poner, cambiar o quitar la contraseña. Cambiar y quitar piden la actual. */
function PasswordModal({ mode, onClose, onDone }: { mode: Mode; onClose(): void; onDone(msg: string): void }) {
  const t = useTheme();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsCurrent = mode !== 'set';
  const needsNew = mode !== 'remove';

  const submit = async () => {
    if (busy) return;
    setError(null);
    if (needsNew && next.length < MIN_LENGTH) return setError(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`);
    if (needsNew && next !== repeat) return setError('Las contraseñas no coinciden.');
    setBusy(true);
    try {
      const st = useTeacher.getState();
      if (needsCurrent && !(await st.checkPassword(current))) {
        setError('La contraseña actual no es correcta.');
        return;
      }
      if (mode === 'remove') {
        await st.removePassword();
        onDone('Se quitó la contraseña: los exámenes y resultados ya no están cifrados en este dispositivo.');
      } else {
        await st.setPassword(next);
        onDone(mode === 'set' ? 'Listo: el modo Maestro está protegido. Se bloqueará al salir, al recargar y tras 10 minutos sin actividad.' : 'Se cambió la contraseña.');
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'set' ? 'Proteger con contraseña' : mode === 'change' ? 'Cambiar contraseña' : 'Quitar contraseña';
  return (
    <ModalShell title={title} onClose={onClose}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {mode === 'set' ? (
          <Banner icon="warning-outline" color={t.warning} text="Si olvidas la contraseña no se puede recuperar: tendrías que borrar los datos del modo Maestro. Exporta tus exámenes como respaldo." />
        ) : null}
        {needsCurrent ? (
          <Field label="Contraseña actual">
            <PasswordField value={current} onChange={setCurrent} placeholder="Contraseña actual" autoFocus onSubmit={needsNew ? undefined : submit} />
          </Field>
        ) : null}
        {needsNew ? (
          <>
            <Field label={mode === 'set' ? 'Contraseña' : 'Contraseña nueva'} hint={`Al menos ${MIN_LENGTH} caracteres. Mejor una frase que solo tú conozcas.`}>
              <PasswordField value={next} onChange={setNext} placeholder="Contraseña" autoFocus={!needsCurrent} />
            </Field>
            <Field label="Repite la contraseña">
              <PasswordField value={repeat} onChange={setRepeat} placeholder="Repite la contraseña" onSubmit={submit} />
            </Field>
          </>
        ) : null}
        {error ? <Text style={{ color: t.danger, fontSize: 13, marginBottom: 8 }}>{error}</Text> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
          {busy ? <ActivityIndicator color={t.primary} /> : null}
          <Button label="Cancelar" onPress={onClose} />
          <Button label={mode === 'remove' ? 'Quitar contraseña' : 'Guardar'} icon={mode === 'remove' ? 'lock-open-outline' : 'lock-closed-outline'} kind={mode === 'remove' ? 'danger' : 'primary'} onPress={submit} disabled={busy} />
        </View>
      </ScrollView>
    </ModalShell>
  );
}

/** Tarjeta en «Mis exámenes» para proteger el modo Maestro. */
export function SecurityCard() {
  const t = useTheme();
  const secured = useTeacher((s) => s.secured);
  const [mode, setMode] = useState<Mode | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Card accent={secured ? t.success : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Ionicons name={secured ? 'lock-closed' : 'lock-open-outline'} size={22} color={secured ? t.success : t.textMuted} />
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', flex: 1 }}>{secured ? 'Protegido con contraseña' : 'Proteger con contraseña'}</Text>
      </View>
      <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 19 }}>
        {secured
          ? 'Tus exámenes, el banco de preguntas y los resultados están cifrados en este dispositivo. Para entrar al modo Maestro se pide la contraseña al recargar, al volver al editor y tras 10 minutos sin actividad.'
          : 'Si usas una computadora compartida (por ejemplo, la del laboratorio), pon una contraseña: los exámenes, el banco de preguntas y los resultados se guardan cifrados y nadie podrá verlos ni usarlos sin ella.'}
      </Text>
      {msg ? <Banner icon="checkmark-circle" color={t.success} text={msg} onClose={() => setMsg(null)} /> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {secured ? (
          <>
            <Button label="Bloquear ahora" icon="lock-closed-outline" kind="primary" onPress={() => useTeacher.getState().lock()} />
            <Button label="Cambiar contraseña" icon="key-outline" onPress={() => setMode('change')} />
            <Button label="Quitar contraseña" icon="lock-open-outline" kind="ghost" onPress={() => setMode('remove')} />
          </>
        ) : (
          <Button label="Poner contraseña" icon="lock-closed-outline" kind="primary" onPress={() => setMode('set')} />
        )}
      </View>
      {mode ? (
        <PasswordModal
          mode={mode}
          onClose={() => setMode(null)}
          onDone={(text) => {
            setMode(null);
            setMsg(text);
          }}
        />
      ) : null}
    </Card>
  );
}
