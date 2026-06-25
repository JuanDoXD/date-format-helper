# Changelog

All notable changes documented here. Plugin version is aligned with the ZH version it implements.

## [1.7.0] — 2026-05-27

Tipo de definición (Airing / Caption) + Versión (V1 / V2).

### Added

- **Fieldset "Definición"** al top con 2 segmented controls:
  - **Tipo**: `Airing` (la definición actual, expandida, para covers con foco) / `Caption` (la nueva definición compacta para covers sin foco).
  - **Versión**: `V1` (literal a la spec del ZH actual) / `V2` (ajustes inspirados en la def Caption).
- **Airing V2 implementa el word order DE locale-native**: el participio se mueve al final cuando hay date.
  - V1 ES: `Emitido sábado, 20:00` → V2 ES: idéntico (sin cambios para ES/PT).
  - V1 DE: `Gesendet Samstag, 20:00` → V2 DE: `Samstag, 20:00 gesendet`.
  - V1 DE: `Aufgenommen gestern, 20:00` → V2 DE: `Gestern, 20:00 aufgenommen`.
  - V1 DE: `Geplant Morgen, 20:00` → V2 DE: `Morgen, 20:00 geplant`.
  - `Live` y `Aufnahme` no son participios — V2 los mantiene como V1.
- **Caption V1 stub**: el selector existe y aplica `defType: caption`, pero el output cae a Airing V1 (con aviso visible en UI) hasta que Localization cierre la spec completa.
- **Formato de hora se mantiene en `HH:MM` en V2.** No se añaden `a las` / `h` / `Uhr` — el formato sintético es más legible y consistente para horas no-redondas (e.g. 17:35 vs 17:35h).

### Persistencia

`defType` y `defVersion` se guardan en el `pluginData` del nodo. Al re-abrir el plugin sobre un text layer etiquetado, los selectores se restauran.

### Tests

53 compose + 1251 anchor + **48 override** (12 nuevos casos V2 DE / Caption stub) = **1352 verificaciones** verdes.

## [1.6.1] — 2026-05-27

Pulido visual menor.

### Changed

- Eliminados los operadores `+` entre tarjetas de la composición — la concatenación visual ya transmite suma.
- Coma más compacta (padding reducido, min-width 18 px, font-size 14 px).
- Controles Auto/On/Off ganan altura (24 px) y font-size (11 px) ahora que tienen más espacio horizontal.

### Fixed

- Event listeners del 3-state segmented apuntaban a `.override-row` (clase legacy). Click en On/Off no respondía.

## [1.6.0] — 2026-05-27

Composition visualization — mapea directamente a la tabla de ZH.

### Changed

- **Bloques en el output** se renderean como tarjetas coloreadas estilo tabla ZH: `Prefix + DATE + , + Time`.
  - Prefix: tarjeta amarilla
  - DATE: tarjeta verde
  - Coma: tarjeta rosa (auto, no controlable)
  - Time: tarjeta azul
- **`+` entre tarjetas** refuerza la lectura "literal compuesto de elementos sumados".
- **Estado visual de cada tarjeta**:
  - Vivo (con color de marca): el bloque se rendea en el output.
  - Atenuado (transparente, opacity 0.4): el bloque no se rendea (sea por Auto natural off o por Off forzado).
- **Coma atenuada** automáticamente cuando Time se desactiva, o cuando no hay nada a su izquierda (prefix + date ambos off).
- **+ operadores atenuados** cuando alguna de las dos tarjetas adyacentes está off — refuerza visualmente la composición real.
- **Auto ✓ / Auto ✕ dentro de cada tarjeta** sigue diciendo el estado natural del nivel actual.
- **Override controls (Auto/On/Off)** debajo de cada tarjeta correspondiente (Prefix, DATE, Time). Sin control para coma — la coma se deriva automáticamente del estado de Time.

### Why

La tabla de "Composición por defecto" en ZH usa precisamente esta gramática visual con esos cuatro colores. Mapear el plugin 1:1 a esa documentación hace que (a) los diseñadores sepan inmediatamente qué bloque están viendo, (b) los devs lean la composición como una suma que ya tienen que implementar.

## [1.5.0] — 2026-05-27

Overrides 3-state: Auto / On / Off por bloque.

### Changed

- **Override pills sustituidos por segmented control de 3 estados** por bloque (Prefix, Date, Time). Cada uno tiene `Auto · On · Off`. El segmento Auto muestra ✓ (aplica) o ✕ (no aplica) según el estado natural del nivel actual, así siempre sabes qué default heredas sin tener que recordarlo.
- **Override es ahora explícito** por posición: si el segmento seleccionado no es Auto, estás forzando. Sin indicadores secundarios necesarios.
- **API de compose() ampliado** con `prefixMode`, `dateMode`, `timeMode` (`'auto'|'on'|'off'`). El API legacy (`includePrefix`/`includeDate`/`includeTime` boolean) sigue funcionando para tests existentes; mode tiene precedencia si está definido.
- **Metadata persistente** ahora guarda `prefixMode`/`dateMode`/`timeMode` en lugar de los booleans. Carga: si encuentra modos los usa; si encuentra booleans legacy, los traduce a modo equivalente (auto / on / off).
- **Estándar** sustituye a "No grabación" en el selector de dominio.
- **Scrubber labels a 11 px** y VIVO SVG completo (antes estaba truncado).

### Tests

53 compose + 1251 anchor + **36 override** (7 nuevos casos del API mode-based) = **1340 verificaciones**.

## [1.4.1] — 2026-05-27

### Changed

- **Labels del scrubber auto-explicativos**: "Hoy-Ayer", "Hoy-Mñn." en vez de "Ayer" / "Mañana". Quitado el literal aclaratorio redundante debajo de los dots.
- **Live en azul brand** (var(--bg-brand) / var(--text-brand)) en vez de rojo.
- **Más aire** entre el título "Cuándo" y los labels del scrubber.
- **Window 360 → 420 px** para que los labels "Hoy-Ayer" / "Hoy-Mñn." quepan sin truncar.

## [1.4.0] — 2026-05-27

Scrubber temporal en un solo control + overrides persistentes.

### Changed

- **Fusionado Cuándo + Distancia en un único scrubber horizontal** con 8 stops. El stop Directo se marca en rojo. Debajo, un literal grande muestra el nivel activo ("Pasado 2-7 días", "Futuro Hoy-Mañana", etc.). Click directo en cualquier stop o etiqueta. Teclado: flechas ← → para navegar.
- **Overrides persistentes.** Los toggles Prefix/Date/Time ya no se resetean al cambiar dominio o nivel. Lo que toggles, se queda.
- **Botón "Por defecto"** al lado del label "Bloques en el output" para volver al estado natural cuando lo necesites.

### Why

Un solo control para el eje temporal modela mejor lo que es (un continuo de pasado→ahora→futuro) que dos selectores anidados. Y los overrides son intención del diseñador — no debería perderse al ajustar otra cosa.

## [1.3.0] — 2026-05-27

Segmented controls reemplazan dropdowns (matching Plugin Contenidos pattern).

### Changed

- **Dominio** ahora es un segmented control (No grabación / Grabación) con iconos.
- **Nivel temporal** dividido en dos niveles visuales:
  - **Cuándo** (Pasado · Directo · Futuro) — bucket principal con iconos del Plugin Contenidos: `ph-arrow-counter-clockwise`, `ph-fill ph-circle` (rojo, igual que Live), `ph-clock`.
  - **Distancia** (sub-nivel) — pills contextuales: 4 para Pasado, 3 para Futuro, oculto para Directo.
- Cada bucket recuerda su último sub-nivel: si vas a Pasado, eliges "Hoy-Ayer", saltas a Directo, y vuelves a Pasado, sigue en "Hoy-Ayer".
- Internamente sigue funcionando el modelo de 8 `level` IDs. compose() y tests sin cambios.

### Why

Dropdowns esconden opciones. Pills muestran todo el rango de elección al primer vistazo — un click vs un click+lectura+click.

## [1.2.0] — 2026-05-27

Overrides explícitos: activar/desactivar cada bloque de la composición.

### Added

- **3 pill toggles** (Prefix / Date / Time) en el fieldset "Composición". Click para activar/desactivar el bloque correspondiente en el output.
- **Estado natural por nivel × dominio**: cada toggle se inicializa según lo que el nivel renderiza por defecto. Cambiar level o domain resetea los toggles a su estado natural.
- **Indicador de override**: un punto warn cuando el toggle deviates del estado natural.
- **Compose() acepta `includePrefix`, `includeDate`, `includeTime`** (opcionales, defaults a true).
- **Semántica**:
  - "Quitar" (force off): siempre funciona, el bloque se omite.
  - "Forzar" Prefix: usa el prefix del nivel. No-op si no hay prefix definido para ese level/domain (e.g. no_grabacion future_*).
  - "Forzar" Date: usa el formato de fecha del nivel. No-op para "Directo" (sin formato definido).
  - "Forzar" Time: usa timeStart en HH:mm. Útil para añadir hora a niveles que no la renderean por defecto (past_other_years, past_same_year, future_far).
- **Persistencia en metadata**: los overrides se guardan en el nodo. Al reabrir el plugin sobre un text layer etiquetado, los toggles se restauran a la posición guardada.
- **29 override tests** + `naturalBlocks()` verificada para los 8 niveles × 2 dominios.

### Tests

53 compose cases + 1251 anchor checks + 29 override checks = **1333 verificaciones**. Todas verdes.

## [1.1.0] — 2026-05-27

Implements ZH "Time & Date format" v0.2. Plugin Contenidos design system alignment.

### Added

- **Smart anchor logic.** Cambiar el nivel temporal regenera fecha/hora dentro del rango coherente para ese nivel.
- **Botón "Ahora"** (`ph-clock`): resetea fecha y hora a los valores actuales, snap a 10 minutos.
- **Botón "Regenerar"** (`ph-arrows-clockwise`): genera nueva fecha aleatoria dentro del rango del nivel actual. Permite rellenar varios text layers con variaciones.
- **Snap a intervalos de 10 minutos** en todos los inputs de hora. Random TV slot picker dentro de 06:00–23:50.
- **Random TV duration** para Directo (20/30/40/50/60 minutos).

### Changed

- **Restyle completo** matching Plugin Contenidos: Phosphor Icons, color tokens completos, operadora switcher en header (mplus / o2 / vivo), fieldsets, inputs 30px / radius 10px, apply bar fija al pie.
- **Locale selector** sustituido por **operadora switcher** con logos SVG embebidos.
- `manifest.json` añade `https://unpkg.com` a `allowedDomains` para cargar Phosphor Icons CSS.

### Tests

- 53 compose cases (sin cambios) + 1251 anchor checks (200 iter × 6 levels + edge cases + randomness spread).

## [1.0.0] — 2026-05-27

Implements ZH "Time & Date format" v0.2.

### Added

- Composición de strings para 8 niveles temporales × 2 dominios (no_grabación, grabación) × 3 locales (es-ES, de-DE, pt-BR).
- UI con preview live, soporte de tema Figma (light/dark), prefill desde plugin data.
- Detección de selección: aplica al text layer seleccionado o crea uno nuevo.
- Metadata persistente en el nodo: `domain`, `level`, `locale`, `referenceDate`, `timeStart`, `timeEnd`, `pluginVersion`, `zhVersion`, `appliedAt`.
- Test suite con 53 casos derivados del xlsx de referencia. Todos pasan en esta release.

### Decisions baked in

- Regla de capitalización estándar locale aplicada (corrección respecto al ZH original, donde aparecía "Programado Mañana" capitalizado tras prefix).
- Sin nivel `future_other_years` (EPG max ~1 semana, no aplica).
- pt-BR usa weekday corto sin "-feira" (pending validación).

### Pending validation

- Prefijos DE inferidos (Gesendet / Live / Aufgenommen / Aufnahme / Geplant).
- Prefijos PT-BR inferidos (Exibido / No ar / Gravado / Gravando / Programado).
- Long date pt-BR (`10 maio` vs `10 de maio`).
