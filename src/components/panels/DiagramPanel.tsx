/** Diagrama de flujo / Nassi-Shneiderman generado a partir del código. */
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line as SvgLine, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { buildFlow, FlowDiagram } from '../../core/flowchart/model';
import { FEl, layoutClassic, layoutNassi } from '../../core/flowchart/layout';
import { arrowHead, shapeExtras, shapePath, textPositions, toSVG } from '../../core/flowchart/svg';
import { translateSyntaxError } from '../../core/errors';
import { explainSyntaxError } from '../../core/syntaxHelp';
import { useActiveFile, useApp } from '../../store/app';
import { copyText, saveTextFile } from '../../ui/platform';
import { MONO, useTheme } from '../../ui/theme';
import { Chip, Empty, IconButton } from '../ui';

/** En web react-native-svg reenvía los props de "responder" al DOM: se usa onClick. */
function pressProps(fn: (() => void) | undefined): any {
  if (!fn) return {};
  return Platform.OS === 'web' ? { onClick: fn, style: { cursor: 'pointer' } } : { onPress: fn };
}

export default function DiagramPanel() {
  const t = useTheme();
  const file = useActiveFile();
  const code = file?.code ?? '';
  const execLine = useApp((s) => (s.run && (s.run.status === 'paused' || s.run.status === 'running' || s.run.status === 'input') ? s.run.line : null));
  const mode = useApp((s) => s.settings.diagramMode);
  const showComments = useApp((s) => s.settings.diagramComments ?? true);
  const update = useApp((s) => s.updateSettings);
  const jump = useApp((s) => s.jumpToLine);
  const [debounced, setDebounced] = useState(code);
  const [selected, setSelected] = useState('Programa principal');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(code), 350);
    return () => clearTimeout(id);
  }, [code]);

  const result = useMemo((): { ok: true; list: FlowDiagram[] } | { ok: false; error: string } => {
    try {
      return { ok: true, list: buildFlow(debounced, { showComments }) };
    } catch (e: any) {
      if (!e?.loc) return { ok: false, error: translateSyntaxError(e?.message ?? String(e)) };
      const x = explainSyntaxError(debounced, e);
      return { ok: false, error: `Línea ${x.line}: ${x.title}. ${x.message}` };
    }
  }, [debounced, showComments]);

  const diagram = result.ok ? result.list.find((d) => d.name === selected) ?? result.list[0] : null;
  const layout = useMemo(() => (diagram ? (mode === 'classic' ? layoutClassic(diagram) : layoutNassi(diagram)) : null), [diagram, mode]);

  if (!result.ok) {
    return (
      <View style={{ flex: 1, backgroundColor: t.surface }}>
        <Empty icon="git-network-outline" text={`No se puede dibujar el diagrama porque hay un error de sintaxis.\n${result.error}`} />
      </View>
    );
  }
  if (!diagram || !layout) return null;

  const pal = t.flow;
  const exportSvg = () => saveTextFile(`${(file?.name ?? 'programa').replace(/\.js$/, '')}-${diagram.name.replace(/[^\w]+/g, '_')}.svg`, toSVG(layout, pal, diagram.name), 'image/svg+xml');

  const renderEl = (el: FEl, i: number) => {
    if (el.t === 'box') {
      const hl = execLine !== null && el.line === execLine && el.line > 0;
      const isComment = el.shape === 'comment';
      const fill = el.shape === 'connector' ? pal.stroke : pal.fills[el.shape] ?? 'none';
      const stroke = hl ? pal.highlight : isComment ? '#608b4e' : pal.stroke;
      const strokeWidth = hl ? 3 : 1.2;
      const dash = el.dashed || isComment ? '5,4' : undefined;
      const textColor = isComment ? (t.dark ? '#85c391' : '#386e3a') : pal.text;
      return (
        <React.Fragment key={i}>
          <Path
            d={shapePath(el)}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dash}
            {...pressProps(el.line > 0 ? () => jump(el.line) : undefined)}
          />
          {shapeExtras(el).map((e, j) => (
            <SvgLine key={j} x1={e[0]} y1={e[1]} x2={e[2]} y2={e[3]} stroke={stroke} strokeWidth={1.2} />
          ))}
          {textPositions(el).map((tp, j) => (
            <SvgText
              key={j}
              x={tp.x}
              y={tp.y}
              textAnchor={tp.anchor}
              fill={textColor}
              fontSize={12}
              fontFamily={MONO}
              fontWeight={hl ? 'bold' : 'normal'}
              fontStyle={isComment ? 'italic' : 'normal'}
            >
              {tp.text}
            </SvgText>
          ))}
        </React.Fragment>
      );
    }
    if (el.t === 'line') {
      const pts: string[] = [];
      for (let k = 0; k < el.pts.length; k += 2) pts.push(`${el.pts[k]},${el.pts[k + 1]}`);
      const head = el.arrow ? arrowHead(el.pts) : null;
      return (
        <React.Fragment key={i}>
          <Polyline points={pts.join(' ')} fill="none" stroke={pal.stroke} strokeWidth={1.2} strokeDasharray={el.dashed ? '5,4' : undefined} />
          {head ? <Path d={head} fill={pal.stroke} /> : null}
        </React.Fragment>
      );
    }
    return (
      <SvgText key={i} x={el.x} y={el.y} textAnchor={el.anchor} fill={el.muted ? pal.muted : pal.text} fontSize={12} fontFamily={MONO} fontWeight={el.bold ? 'bold' : 'normal'}>
        {el.text}
      </SvgText>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      <View style={[styles.toolbar, { borderBottomColor: t.border }]}>
        <Chip label="Flujo" active={mode === 'classic'} onPress={() => update({ diagramMode: 'classic' })} style={styles.chip} />
        <Chip label="Nassi-Shneiderman" active={mode === 'nassi'} onPress={() => update({ diagramMode: 'nassi' })} style={styles.chip} />
        <Chip label="Comentarios" active={showComments} onPress={() => update({ diagramComments: !showComments })} style={styles.chip} />
        <View style={{ flex: 1 }} />
        <IconButton icon="remove" label="Alejar" onPress={() => setZoom((z) => Math.max(0.3, +(z - 0.15).toFixed(2)))} size={18} />
        <Text style={{ color: t.textMuted, fontSize: 12, width: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</Text>
        <IconButton icon="add" label="Acercar" onPress={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))} size={18} />
        <IconButton icon="copy-outline" label="Copiar SVG" onPress={() => copyText(toSVG(layout, pal, diagram.name))} size={18} />
        <IconButton icon="download-outline" label="Exportar SVG" onPress={exportSvg} size={18} />
      </View>
      {result.list.length > 1 ? (
        <ScrollView horizontal style={{ flexGrow: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }} contentContainerStyle={{ padding: 6 }}>
          {result.list.map((d) => (
            <Chip key={d.id} label={d.kind === 'main' ? 'Principal' : d.name} active={d.name === diagram.name} onPress={() => setSelected(d.name)} style={styles.chip} />
          ))}
        </ScrollView>
      ) : null}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center' }}>
        <ScrollView horizontal contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Svg width={layout.w * zoom} height={layout.h * zoom} viewBox={`0 0 ${layout.w} ${layout.h}`}>
            {layout.els.map(renderEl)}
          </Svg>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 4, minHeight: 44, borderBottomWidth: StyleSheet.hairlineWidth, flexWrap: 'wrap' },
  chip: { marginBottom: 0 },
});
