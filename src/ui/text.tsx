/**
 * Text y TextInput con la tipografía de la marca (Nunito en web). Se usan en
 * lugar de los de react-native para que toda la interfaz comparta la misma
 * fuente; un `fontFamily` explícito (por ejemplo MONO para código) la
 * reemplaza como siempre. Los Text anidados no fijan fuente: heredan la del
 * Text que los contiene (así el resaltado de código sigue en monoespaciada).
 */
import { ComponentPropsWithRef, createContext, useContext } from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import { FONT } from './theme';

const base = FONT ? { fontFamily: FONT } : null;
const InsideText = createContext(false);

export function Text({ style, children, ...props }: ComponentPropsWithRef<typeof RNText>) {
  const nested = useContext(InsideText);
  if (nested || !base)
    return (
      <RNText {...props} style={style}>
        {children}
      </RNText>
    );
  return (
    <InsideText.Provider value={true}>
      <RNText {...props} style={[base, style]}>
        {children}
      </RNText>
    </InsideText.Provider>
  );
}
// eslint-disable-next-line @typescript-eslint/no-redeclare -- valor y tipo con el mismo nombre, como en react-native
export type Text = RNText;

export function TextInput({ style, ...props }: ComponentPropsWithRef<typeof RNTextInput>) {
  return <RNTextInput {...props} style={[base, style]} />;
}
// eslint-disable-next-line @typescript-eslint/no-redeclare -- permite useRef<TextInput>
export type TextInput = RNTextInput;
