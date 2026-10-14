/**
 * Puntos de quiebre del diseño. En pantalla ancha el editor y los paneles van
 * lado a lado; en angosta el código va arriba (60 % del alto) y abajo las
 * pestañas con su panel, o lado a lado si el celular está acostado. En
 * teléfono (o con poca altura) la barra de herramientas se compacta y se
 * esconde el pie de página para dejar más espacio al contenido.
 */
import { useWindowDimensions } from 'react-native';
import { useApp } from '../store/app';

/** Desde este ancho el editor y los paneles se muestran lado a lado. */
export const WIDE_MIN = 900;
/** Parte del alto (o del ancho, con el celular acostado) que ocupa el código en pantallas angostas. */
export const CODE_SHARE = 0.6;

/** side: pantalla ancha · column: código arriba y paneles abajo · row: celular acostado, lado a lado. */
export type Split = 'side' | 'column' | 'row';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const wide = width >= WIDE_MIN;
  const phone = width < 600 || (height < 500 && !wide);
  const split: Split = wide ? 'side' : height < 500 && width >= 600 ? 'row' : 'column';
  return { width, height, wide, phone, split };
}

/**
 * Margen al final de los paneles para que la mascota no tape las últimas
 * filas. Solo hace falta con el celular acostado: en vertical la mascota se
 * para encima de las pestañas, sobre el código.
 */
export function usePanelBottomPad(base = 12) {
  const mascot = useApp((s) => s.settings.mascot);
  const { split } = useLayout();
  return mascot && split === 'row' ? 56 : base;
}
