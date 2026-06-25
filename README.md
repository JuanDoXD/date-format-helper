# Date Format Helper

Plugin de Figma para componer strings de fecha según el modelo definido en Zeroheight "Time & Date format" de Entertainment XD.

- **Plugin version**: 1.0.0
- **ZH version implementada**: 0.2
- **Owner**: XD — Product Designer
- **Locales soportados**: ES (Movistar Plus+), DE (O2), PT-BR (VIVO)
- **Dominios**: No grabación, Grabación

## Para qué sirve

Reemplaza la escritura manual de fechas en mocks por strings generados a partir del modelo cerrado. El diseñador selecciona `dominio + nivel temporal + idioma + fecha + hora`, y el plugin escribe en el text layer el string correcto según ZH.

Beneficios:

- Mocks consistentes con la definición global desde el primer día.
- Eliminar el ping-pong con DEV sobre formatos de fecha.
- Metadata en cada text layer permite auditoría posterior (v2).
- Set de referencia compartido entre tecnologías.

## Instalación (desarrollo local)

1. Abre Figma desktop.
2. Menú: **Plugins → Development → Import plugin from manifest…**
3. Selecciona el archivo `manifest.json` de esta carpeta.
4. El plugin aparece en **Plugins → Development → Date Format Helper**.

Para publicar a la organización Telefónica, sigue el flujo de Figma: **Plugins → Development → Publish new release** y compártelo como private plugin.

## Uso

1. Selecciona un text layer (opcional — si no hay selección, el plugin crea uno).
2. Abre el plugin.
3. Configura: dominio, nivel temporal, idioma, fecha, hora.
4. Previsualiza el string generado.
5. Pulsa **Aplicar**.

El plugin guarda metadata en el nodo (`pluginData.dateFormat`) con los inputs usados, versión del plugin y versión de ZH. Esto permite re-abrir el plugin sobre un text layer ya etiquetado y ver/modificar sus parámetros sin perderlos.

### Niveles temporales

| Nivel | Rango | Formato | Hora |
|---|---|---|---|
| Pasado +1 año | Año distinto al actual | Short date | No |
| Pasado +7 días | Mismo año, más de 7 días | Long date sin año | No |
| Pasado 2-7 días | 2 a 7 días atrás | Día de la semana | Sí |
| Pasado Hoy-Ayer | Hoy (ya emitido) o ayer | Adverbio | Sí |
| Directo | Ahora | — (implícito) | Sí (rango) |
| Futuro Hoy-Mañana | Hoy (todavía no) o mañana | Adverbio | Sí |
| Futuro 2-7 días | 2 a 7 días en futuro | Día de la semana | Sí |
| Futuro +7 días | Más de 7 días | Long date sin año | No |

### Regla de capitalización

- Si hay prefix: la fecha va en su forma nativa del locale (en ES y PT, días de la semana y adverbios en minúscula; en DE, días siempre capitalizados).
- Si no hay prefix: se capitaliza la primera letra del string (regla de inicio de oración).

## Arquitectura

```
date-format-helper/
├── manifest.json         · Definición del plugin para Figma
├── code.js               · Main thread (Figma API: selección, write, metadata)
├── ui.html               · UI thread (form + preview + compose inline)
├── src/
│   └── compose.js        · Lógica core (fuente única de verdad)
├── tests/
│   ├── cases.json        · 53 casos extraídos del xlsx test suite
│   └── run-tests.js      · Test runner Node
├── package.json
└── README.md
```

**Importante**: `src/compose.js` es el módulo canónico. La función `compose()` está también inlined en `ui.html` (porque Figma plugins no permiten cargar JS externo desde la UI). Si modificas `src/compose.js`, copia las funciones actualizadas dentro del `<script>` de `ui.html` y vuelve a correr los tests.

## Tests

```bash
node tests/run-tests.js
```

Los 53 casos cubren:

- 16 casos ES (LOCKED, derivados directamente de ZH)
- 16 casos DE (DRAFT, pendientes de validación con Localization O2)
- 16 casos PT-BR (DRAFT, pendientes de validación con Localization VIVO)
- 5 edge cases (year boundary, start-of-year, regla de capitalización corregida, DE weekday capitalizado)

El test runner valida que `compose()` produce exactamente el `expected_output` de cada caso. Si falla algún caso, no se debe publicar el plugin: indica divergencia entre la lógica y el contrato.

## Roadmap

### v1.0 (esta release) — Composición básica

- 8 niveles × 2 dominios × 3 locales.
- Aplica string a text layer seleccionado o crea uno nuevo.
- Guarda metadata en el nodo.
- Re-prefill del form al seleccionar un nodo ya etiquetado.

### v1.1 — Validación de locales draft

- Una vez Localization (O2, VIVO) valide los prefijos y formas DE/PT-BR, actualizar `src/compose.js` y subir versión.
- Confirmar formato weekday pt-BR (corto "segunda" vs largo "segunda-feira").
- Confirmar long date pt-BR ("10 maio" vs "10 de maio").

### v2.0 — Overrides + auditoría

- Forzar/quitar Prefix.
- Forzar/quitar Time.
- Range floor con selector.
- Custom prefix (marcado como override no estándar).
- Auditoría: escanear page/frame y listar text layers de fecha sin metadata del plugin.
- Reporte de inconsistencias respecto al modelo.

### Backlog

- Multi-locale preview lado a lado.
- Validación cruzada: si el nivel temporal es "Pasado Hoy-Ayer" pero la fecha no es hoy/ayer, mostrar warning.
- Integración con design tokens (si Figma Variables expone los formatos de fecha como tokens, sustituir hardcoded por refs).

## Riesgos y mitigaciones

- **Source of truth duplicada**: ZH es la fuente conceptual. Este plugin la codifica. Si divergen, gana ZH. El campo `zhVersion` en metadata permite detectar cuándo un nodo fue generado con una versión vieja del modelo.
- **Mantenimiento**: cada cambio en ZH requiere actualizar `src/compose.js`, sincronizar `ui.html`, actualizar `cases.json` (regenerar desde xlsx) y subir versión. Owner: XD.
- **Adopción**: que el plugin exista no garantiza uso. Incluir en checklist de handoff XD → DEV. v2 añade auditoría para detectar text layers sin plugin data.

## Open questions activas

Ver hoja "Open Questions" en `date-format-helper-test-suite-v0.2.xlsx`.

Críticas antes de cerrar v1.1:

- Q04: confirmar prefijos DE con Localization O2.
- Q05: confirmar prefijos PT-BR con Localization VIVO.
- Q06: pt-BR long date `10 maio` vs `10 de maio`.
- Q11: timezone handling (responsabilidad DEV).
- Q12: fallback render para fechas nulas/inválidas.

## Contacto

XD — Product Designer (owner).
Issues, cambios al modelo, o validaciones: contactar al owner.
