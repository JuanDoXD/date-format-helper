# Decisiones · Date Format Helper

Documento vivo del modelo de fechas para Entertainment XD. Abrir `decisions.html` en navegador.

## Estructura

```
docs/
├── decisions.html      # documento principal — abrir en navegador
├── img/                # capturas de pantalla referenciadas por decisions.html
│   ├── caption-cover-ayer.png
│   ├── episodios-himym.png
│   ├── ficha-live-emision.png
│   ├── ficha-futuro-proximamente.png
│   ├── proximas-emisiones-pill-2250.png
│   ├── proximas-emisiones-pill-10dic.png
│   ├── proximas-emisiones-recording-dot.png
│   └── zh-original-table.png
└── README.md           # este archivo
```

## Añadir capturas

Las cards de "Casos de uso" muestran un placeholder gris con el path esperado mientras la imagen no existe. Al colocar el PNG con el nombre exacto en `docs/img/`, la imagen aparece automáticamente al recargar.

Nombres esperados (asignados a cada card):

| Card | Filename |
|---|---|
| Caption inline en cover "Emitido ayer" | `caption-cover-ayer.png` |
| Episodios en ficha HIMYM | `episodios-himym.png` |
| Live en ficha "En emisión" | `ficha-live-emision.png` |
| Futuro en ficha "Próximamente" | `ficha-futuro-proximamente.png` |
| Pill EPG "22:50" | `proximas-emisiones-pill-2250.png` |
| Pill EPG "10 de diciembre" | `proximas-emisiones-pill-10dic.png` |
| Recording dot rojo | `proximas-emisiones-recording-dot.png` |
| Tabla ZH original | `zh-original-table.png` |

Formato recomendado: PNG, ancho 600-800 px (más grande es ok, se escala). Recorta sólo el área relevante para que el doc se lea ágil.

## Añadir caso nuevo

En `decisions.html`, dentro de `<section id="casos">`, copiar un bloque `<div class="case">` y editar:

```html
<div class="case">
  <div class="case-img">
    <img src="img/MI-NUEVA-CAPTURA.png" alt="..." onerror="this.dataset.broken='1'">
    <div class="missing"><i class="ph ph-image"></i><code>docs/img/MI-NUEVA-CAPTURA.png</code></div>
  </div>
  <div class="case-body">
    <h4>Título del caso <span class="badge warn"><i class="ph ph-warning"></i>Validar</span></h4>
    <div class="applies"><strong>Set:</strong> ... · <strong>Celda:</strong> ... · <strong>Locale:</strong> ...</div>
    <div class="note">Notas, decisiones, riesgos, etc.</div>
  </div>
</div>
```

Badges disponibles: `ok` (verde), `warn` (amarillo), `err` (rojo), `info` (azul), `neutral` (gris).

## Cerrar un pendiente

En el doc:

1. Buscar el `<div class="q-item">` en `<section id="pendientes">`.
2. Cortar el bloque y pegarlo como `<li>` en `<ul class="decision-log">` con la fecha de hoy:

```html
<li>
  <span class="date">2026-MM-DD</span>
  <div class="body">Descripción de la decisión cerrada.</div>
  <span class="badge ok"><i class="ph ph-check"></i>Cerrado</span>
</li>
```

3. Actualizar el contador en el bloque "Resumen ejecutivo".
4. Actualizar `Última actualización` en el header.

## Actualizar las tablas de sets

Cuando Localization confirme PT-BR o DE de Caption, editar la tabla en `<div class="card">` de Caption: cambiar `<td class="empty">pending</td>` por `<td>output validado</td>`.

## Estilo

- Light/dark automático según OS.
- Phosphor Icons via unpkg (mismo CDN que el plugin).
- Paleta consistente con las composition cards del plugin (Prefix amarillo, DATE verde, Time azul, coma rosa).
