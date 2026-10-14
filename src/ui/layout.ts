/**
 * Puntos de quiebre del diseño. En pantalla ancha el editor y los paneles van
 * lado a lado; en angosta se cambia entre ellos con pestañas, y en teléfono
 * (o con poca altura, como un celular acostado) la barra de herramientas se
 * compacta y se esconde el pie de página para dejar más espacio al contenido.
 */
import { useWindowDimensions } from 'react-native';
import { useApp } from '../store/app';

/** Desde este ancho el editor y los paneles se muestran lado a lado. */
export const WIDE_MIN = 900;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const wide = width >= WIDE_MIN;
  const phone = width < 600 || (height < 500 && !wide);
  return { width, height, wide, phone };
}

/**
 * Margen al final de los paneles para que la mascota (que flota en la esquina
 * de abajo) no tape las últimas filas cuando no hay panel lateral.
 */
export function usePanelBottomPad(base = 12) {
  const mascot = useApp((s) => s.settings.mascot);
  const { wide, height } = useLayout();
  if (!mascot || wide) return base;
  // con poca altura la mascota es más chica y un margen grande escondería todo el contenido
  return height < 500 ? 56 : 150;
}
