/** Código QR (para que los alumnos entren a la sala con la cámara del celular). */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

// solo el generador (sin dependencias de canvas ni de Node)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QR: { create(text: string, opts: { errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' }): { modules: { size: number; data: ArrayLike<number> } } } = require('qrcode/lib/core/qrcode');

export default function QrCode({ value, size = 180 }: { value: string; size?: number }) {
  const { path, n } = useMemo(() => {
    const m = QR.create(value, { errorCorrectionLevel: 'M' }).modules;
    let d = '';
    for (let y = 0; y < m.size; y++)
      for (let x = 0; x < m.size; x++) if (m.data[y * m.size + x]) d += `M${x + 4} ${y + 4}h1v1h-1z`;
    return { path: d, n: m.size + 8 };
  }, [value]);
  // fondo blanco siempre (las cámaras no leen bien los QR invertidos)
  return (
    <View style={{ width: size, height: size, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }} accessibilityLabel="Código QR para entrar a la sala">
      <Svg width={size} height={size} viewBox={`0 0 ${n} ${n}`}>
        <Rect x={0} y={0} width={n} height={n} fill="#fff" />
        <Path d={path} fill="#000" />
      </Svg>
    </View>
  );
}
