import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BORDER, RADIUS, SCRIM, SPACE, TYPE, useTheme } from '../../ui/theme';
import { IconButton, ModalContext } from '../ui';

export default function ModalShell({ title, onClose, children, wide }: { title: string; onClose(): void; children: React.ReactNode; wide?: boolean }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const full = width < 700;
  return (
    <ModalContext.Provider value={true}>
      <Modal visible transparent animationType={full ? 'slide' : 'fade'} onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={[styles.overlay, { backgroundColor: full ? t.bg : SCRIM }]}>
            {!full ? <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" /> : null}
            <View
              style={[
                styles.card,
                { backgroundColor: t.surface, borderColor: t.border },
                full
                  ? { flex: 1, width: '100%', borderRadius: 0, paddingTop: insets.top, paddingBottom: insets.bottom }
                  : { width: Math.min(width - 40, wide ? 980 : 760), maxHeight: '90%', height: wide ? '90%' : undefined },
              ]}
            >
              <View style={[styles.header, { borderBottomColor: t.border }]}>
                <Text style={{ color: t.text, ...TYPE.subheading, fontSize: 19, flex: 1 }}>{title}</Text>
                <IconButton icon="close" label="Cerrar" onPress={onClose} />
              </View>
              <View style={{ flex: full || wide ? 1 : undefined, flexShrink: 1 }}>{children}</View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ModalContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: RADIUS.lg, borderWidth: BORDER, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: SPACE.lg, paddingRight: SPACE.sm, height: 56, borderBottomWidth: BORDER },
});
