/** Antes del examen: sala de espera con las instrucciones, examen terminado o ingreso rechazado. */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Text } from '../../../ui/text';
import { useApp } from '../../../store/app';
import { useStudent } from '../../../store/student';
import { useTheme } from '../../../ui/theme';
import { Button, Heading } from '../../ui';
import { Card, Pill, ScreenHeader } from '../kit';
import { enterFullscreen, fullscreenSupported } from '../lockdown';

import { Centered, Narrow, NetBanner, confirmLeave, placeLabel } from './shared';

export function WaitingView() {
  const t = useTheme();
  const s = useStudent((x) => x.session)!;
  const room = s.room;
  const ready = s.phase === 'ready';
  // examen bloqueado: en la sala del maestro (la práctica individual queda libre)
  const lockable = s.transport.kind !== 'practice';
  if (s.roomClosed) return <EndedView />;
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader icon="school-outline" title={room?.title ?? 'Examen'} subtitle={`${placeLabel(s)} · ${s.identity.name}`} color={t.success} right={<Button label="Salir" icon="exit-outline" onPress={confirmLeave} />} />
      <Narrow>
        <NetBanner />
        {s.pendingApproval ? (
          <Card accent={t.warning}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <ActivityIndicator color={t.warning} />
              <Text style={{ color: t.text, fontSize: 17, fontWeight: '800', marginLeft: 10, flex: 1 }}>Esperando autorización de tu maestro</Text>
            </View>
            <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>{s.pendingApproval}</Text>
            <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 8, lineHeight: 19 }}>
              Cuando lo autorice, regresarás a tu examen con tus respuestas y el tiempo que te quedaba. No cierres esta pantalla; si quieres, avísale a tu maestro.
            </Text>
          </Card>
        ) : !room ? (
          <Card>
            <Centered>
              <ActivityIndicator color={t.primary} />
              <Text style={{ color: t.textMuted, marginTop: 10 }}>Entrando a la sala…</Text>
            </Centered>
          </Card>
        ) : (
          <>
            <Card accent={ready ? t.success : t.primary}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                {ready ? <Ionicons name="checkmark-circle" size={26} color={t.success} /> : <ActivityIndicator color={t.primary} />}
                <Text style={{ color: t.text, fontSize: 17, fontWeight: '800', marginLeft: 10, flex: 1 }}>
                  {ready ? '¡El examen ya comenzó!' : 'Esperando a que el maestro inicie el examen…'}
                </Text>
              </View>
              <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>{room.description}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <Pill icon="help-circle-outline" text={`${room.questionCount} preguntas`} color={t.primary} />
                <Pill icon="time-outline" text={room.durationMin ? `${room.durationMin} minutos` : 'Sin límite de tiempo'} color={t.accent} />
              </View>
            </Card>
            <Card>
              <Text style={{ color: t.text, fontWeight: '800', marginBottom: 8 }}>
                <Ionicons name="lock-closed-outline" size={14} /> Durante el examen
              </Text>
              {room.restrictions.map((r) => (
                <Text key={r} style={{ color: t.textMuted, fontSize: 13, marginBottom: 4 }}>
                  • {r}: desactivado
                </Text>
              ))}
              <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }}>• Las preguntas aparecen en orden aleatorio.</Text>
              <Text style={{ color: t.textMuted, fontSize: 13 }}>• Tu maestro ve tu avance en tiempo real.</Text>
              {room.durationMin ? <Text style={{ color: t.textMuted, fontSize: 13 }}>• El tiempo empieza a contar al presionar «Comenzar». Al terminarse, tu examen se envía solo.</Text> : null}
              {lockable ? (
                <Text style={{ color: t.textMuted, fontSize: 13 }}>
                  • {fullscreenSupported() ? 'El examen se abre en pantalla completa hasta que lo termines. ' : ''}
                  {Platform.OS === 'web'
                    ? 'Si cambias de pestaña o ventana, intentas abrir las herramientas del navegador o tomar capturas, el examen se oculta y tu maestro recibe un aviso.'
                    : 'No se pueden tomar capturas ni grabar la pantalla. Si sales de la app, el examen se oculta y tu maestro recibe un aviso.'}
                </Text>
              ) : null}
              {lockable ? <Text style={{ color: t.textMuted, fontSize: 13 }}>• Tu nombre aparece como marca de agua sobre el examen; no se puede copiar ni seleccionar su texto.</Text> : null}
            </Card>
            <Button
              label="Comenzar examen"
              icon="play"
              kind="primary"
              onPress={() => {
                // la pantalla completa solo se puede pedir dentro del clic
                if (lockable) enterFullscreen();
                useStudent.getState().begin();
              }}
              disabled={!ready}
              style={{ height: 50 }}
            />
          </>
        )}
      </Narrow>
    </View>
  );
}

/** La sala se cerró antes de que el alumno comenzara. */
export function EndedView() {
  const t = useTheme();
  const s = useStudent((x) => x.session)!;
  const exit = () => {
    useStudent.getState().leave();
    useApp.getState().setAppMode('ide');
  };
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader icon="school-outline" title={s.room?.title ?? 'Examen'} subtitle={`${placeLabel(s)} · ${s.identity.name}`} color={t.success} />
      <Narrow>
        <Card accent={t.textMuted} style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Ionicons name="lock-closed-outline" size={44} color={t.textMuted} />
          <Heading style={{ marginTop: 8 }}>El examen terminó</Heading>
          <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
            El maestro cerró la sala antes de que comenzaras tu examen. Si crees que es un error, avísale.
          </Text>
        </Card>
        <Button label="Salir del modo examen" icon="exit-outline" kind="primary" onPress={exit} style={{ height: 46 }} />
      </Narrow>
    </View>
  );
}

export function RejectedView({ reason }: { reason: string }) {
  const t = useTheme();
  return (
    <Narrow>
      <Card accent={t.danger}>
        <Text style={{ color: t.text, fontSize: 17, fontWeight: '800', marginBottom: 6 }}>{/otro dispositivo/.test(reason) && /contin/.test(reason) && !/no autoriz/.test(reason) ? 'Tu examen continúa en otro dispositivo' : 'No puedes entrar a esta sala'}</Text>
        <Text style={{ color: t.textMuted, fontSize: 14, marginBottom: 14 }}>{reason}</Text>
        <Button
          label="Volver"
          icon="arrow-back"
          kind="primary"
          onPress={() => {
            useStudent.getState().leave();
          }}
        />
      </Card>
    </Narrow>
  );
}
