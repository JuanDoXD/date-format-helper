// Date Format Helper — main thread
// Plugin v1.7.1 — implements ZH "Time & Date format" v0.2 (Airing V1/V2 + Caption V1 stub)
// Owner: XD (Entertainment) · Telefónica

const PLUGIN_VERSION = '1.7.1';
const ZH_VERSION = '0.2';

figma.showUI(__html__, {
  width: 420,
  height: 640,
  themeColors: true,
  title: 'Date Format Helper',
});

function getSelectedTextNode() {
  const sel = figma.currentPage.selection;
  if (sel.length === 1 && sel[0].type === 'TEXT') {
    return sel[0];
  }
  return null;
}

function readNodeMetadata(node) {
  const data = node.getPluginData('dateFormat');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (_) {
    return null;
  }
}

function sendSelectionStatus() {
  const node = getSelectedTextNode();
  if (node) {
    figma.ui.postMessage({
      type: 'selection-status',
      status: {
        hasSelection: true,
        nodeId: node.id,
        nodeName: node.name,
        currentText: node.characters,
        metadata: readNodeMetadata(node),
      },
    });
  } else {
    figma.ui.postMessage({
      type: 'selection-status',
      status: { hasSelection: false },
    });
  }
}

figma.on('selectionchange', sendSelectionStatus);

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'ready') {
    sendSelectionStatus();
    return;
  }

  if (msg.type === 'apply') {
    const { output, defType, defVersion, domain, level, locale, referenceDate, timeStart, timeEnd, prefixMode, dateMode, timeMode } = msg;

    let target = getSelectedTextNode();
    let created = false;

    if (!target) {
      target = figma.createText();
      const center = figma.viewport.center;
      target.x = center.x;
      target.y = center.y;
      figma.currentPage.appendChild(target);
      created = true;
    }

    try {
      if (target.hasMissingFont) {
        figma.notify('La fuente del text layer no está disponible. Reemplázala y vuelve a intentarlo.', { error: true });
        if (created) target.remove();
        return;
      }
      const fontName = target.fontName;
      if (fontName === figma.mixed) {
        figma.notify('El text layer tiene fuentes mixtas. Aplica una sola fuente y vuelve a intentarlo.', { error: true });
        return;
      }
      await figma.loadFontAsync(fontName);
      target.characters = output;
    } catch (e) {
      figma.notify('Error: ' + (e && e.message ? e.message : String(e)), { error: true });
      if (created) target.remove();
      return;
    }

    const validMode = (m) => (m === 'on' || m === 'off' || m === 'auto') ? m : 'auto';
    const validDefType = (t) => (t === 'airing' || t === 'caption') ? t : 'airing';
    const validDefVersion = (v) => (v === 'v1' || v === 'v2') ? v : 'v1';
    target.setPluginData('dateFormat', JSON.stringify({
      defType:    validDefType(defType),
      defVersion: validDefVersion(defVersion),
      domain,
      level,
      locale,
      referenceDate,
      timeStart,
      timeEnd: timeEnd || null,
      prefixMode: validMode(prefixMode),
      dateMode:   validMode(dateMode),
      timeMode:   validMode(timeMode),
      pluginVersion: PLUGIN_VERSION,
      zhVersion: ZH_VERSION,
      appliedAt: new Date().toISOString(),
    }));

    figma.currentPage.selection = [target];
    if (created) {
      figma.viewport.scrollAndZoomIntoView([target]);
    }

    figma.notify(created ? 'Text layer creado' : 'Text layer actualizado');
    sendSelectionStatus();
    return;
  }

  if (msg.type === 'close') {
    figma.closePlugin();
    return;
  }
};
