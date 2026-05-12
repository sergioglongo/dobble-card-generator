# Dobble Card Generator — contexto para Claude

App web personal para generar mazos de cartas tipo **Dobble / Spot It!** con
imágenes propias y descargarlos como PDF imprimible. Proyecto de Sergio,
vive en `F:\Proyectos\Personal\Dobble` (también espejo en `D:\Developer\Personales\Doble`).

> Cualquier par de cartas comparte exactamente un símbolo. La base es el
> **plano proyectivo finito** de orden *n* — los símbolos son "puntos" y
> las cartas son "rectas".

## Estado actual

MVP funcional. Verificado:

- `npm test` → 20/20 tests en verde (validan la propiedad de coincidencia única para n=2,3,5,7).
- `npm run build` → bundle prod ≈ 590 KB (≈ 230 KB gzip).
- `npm run dev` → app servida en `http://localhost:5173`.

## Stack

- **Vite 5** + **React 18** + **TypeScript estricto** (`noUnusedLocals`, `noUnusedParameters`, `strict`).
- **pdf-lib** para generar PDF vectorial.
- **localStorage** para persistencia temporal (imágenes en base64 + config).
- **Vitest** para los tests del motor combinatorio.

## Estructura

```
F:\Proyectos\Personal\Dobble\
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.node.json
├── README.md
├── CLAUDE.md                      ← este archivo
├── Juego de cartas Doble.md       ← notas de referencia teórica
├── Cómo implementar Dobble en JavaScript para web.pdf
└── src/
    ├── main.tsx                   ← entrypoint React
    ├── App.tsx                    ← UI principal (uploader + config + preview + PDF)
    ├── styles.css
    ├── lib/
    │   ├── dobble.ts              ← motor combinatorio
    │   ├── dobble.test.ts         ← tests del motor
    │   ├── layout.ts              ← posiciones de símbolos dentro de la carta
    │   ├── storage.ts             ← localStorage helpers
    │   ├── defaults.ts            ← 15 SVGs inline de ejemplo
    │   └── pdf.ts                 ← generación PDF con pdf-lib
    └── components/
        ├── ImageUploader.tsx      ← drag&drop + input file
        ├── SymbolGrid.tsx         ← grilla de símbolos con botón eliminar
        └── CardSvg.tsx            ← preview SVG de una carta (espejo del PDF)
```

## Decisiones de diseño clave

### Motor combinatorio (`src/lib/dobble.ts`)

- Sólo soporta **n primo** porque la construcción cerrada (aritmética mod n)
  no funciona para n compuesto. Para n=4, 6, 8… haría falta búsqueda
  heurística → fuera del MVP.
- `SUPPORTED_ORDERS = [2, 3, 5, 7]` → mazos de 7, 13, 31 y 57 cartas.
- `generateDeck(n)` construye:
  1. Una carta especial con `{0, 1, ..., n}`.
  2. *n* cartas que pasan por el "punto" 0.
  3. *n²* cartas restantes parametrizadas por `(i, j)` con `(i*k + j) mod n`.
- `validateDeck(deck, { strict: true })` confirma que cada par de cartas
  comparte exactamente 1 símbolo. **Los tests deben quedar siempre en verde**.

### Layout de símbolos (`src/lib/layout.ts`)

- Determinístico a partir de un `seed` numérico (`mulberry32`).
- Coordenadas normalizadas: viewBox -1..1, donde 1 es la mitad del lado
  del cuadrado (o sea: el radio inscrito).
- Configuración por anillos según cantidad de símbolos por carta:
  - 3 → triángulo
  - 4 → cuadrado
  - 6 → 1 al centro + 5 alrededor
  - 8 → 1 al centro + 7 alrededor (estilo Dobble clásico)
- El layout incluye jitter radial/angular y rotación aleatoria por símbolo.
- **Importante:** el preview en pantalla (`CardSvg.tsx`) y el PDF
  (`pdf.ts`) usan el MISMO layout con el mismo seed → lo que ves es lo
  que imprimís.

### Generación PDF (`src/lib/pdf.ts`)

- **Cartas cuadradas**, no circulares (cambio reciente).
- **6 cartas por hoja A4**, grilla 2 columnas × 3 filas.
- Las cartas **se tocan entre sí** (sin gaps) para que las líneas de corte
  sean continuas: 3 verticales + 4 horizontales por hoja → una pasada de
  tijera o guillotina separa toda la fila o columna.
- Crop marks adicionales sobresalen 6pt fuera de la grilla en cada
  intersección externa para alinear la regla.
- `cardSidePt` default 265 (≈ 93.5 mm de lado).
- Imágenes PNG/JPEG se embeben directo. **SVGs se rasterizan a PNG** en
  canvas porque pdf-lib no soporta SVG nativo (`rasterizeSvg`,
  `svgRasterSize` default 512px).
- pdf-lib rota imágenes alrededor del bottom-left → en `drawCard` se
  compensa el offset para que la rotación quede centrada en el símbolo.

### Storage (`src/lib/storage.ts`)

- Imágenes como `StoredImage[]` (id, name, dataUrl, mime, w/h, addedAt)
  en localStorage bajo la clave `dobble.images.v1`.
- Config en `dobble.config.v1` (orden n, seed, color de fondo, líneas de
  corte sí/no).
- Manejo explícito de `QuotaExceededError` (~5 MB de límite práctico).

## Cómo correrlo

```bash
# desde F:\Proyectos\Personal\Dobble en Windows / PowerShell
npm install
npm run dev          # http://localhost:5173
npm test             # corre los 20 tests
npm run build        # build de producción → dist/
```

## Convenciones de código

- **Comentarios y mensajes de UI en español rioplatense** (vos, descargá,
  generá), coherente con el resto del proyecto.
- **TypeScript estricto, sin `any`.** Si aparece un `any` justificable,
  comentar por qué.
- **El motor combinatorio es sagrado**: cualquier cambio en `dobble.ts`
  debe seguir pasando `dobble.test.ts`. Si un cambio rompe la propiedad
  "cada par comparte 1 símbolo", está roto el cambio, no el test.
- Preferir **`Edit` sobre `Write`** para cambios pequeños.
- **Imports relativos** dentro de `src/` (sin aliases).

## Roadmap conocido (post-MVP)

- Variar forma de carta (volver a circulares como opción, o rectángulos).
- Categorías temáticas predefinidas (animales, frutas, objetos…).
- Compartir mazos vía URL (códigos base64 comprimidos).
- Soporte para órdenes no primos con búsqueda heurística.
- Exportar como ZIP de PNGs (para impresión on-demand).
- Modo "juego online" para dos jugadores.

## Issues conocidos / notas operativas

- En sesiones donde Claude opera por el filesystem montado (Linux ⟶ Windows
  vía mount FUSE/SMB), los `Write` muy largos (>~9 KB) pueden quedar
  truncados en disco aunque la file tool reporte éxito. Solución que
  funcionó: reescribir el archivo con un `cat > ... << 'EOF'` desde
  `mcp__workspace__bash`, que va al filesystem real sin pasar por la
  file tool. `Edit` de cambios pequeños no tiene este problema.
- `npm install` desde la sandbox Linux también puede dejar paquetes con
  archivos faltantes (vimos faltar `magic-string.es.mjs`). **Hacer
  `npm install` desde Windows nativo.**

## Referencias

- `Juego de cartas Doble.md` en la raíz: resumen teórico del plano
  proyectivo finito con citas.
- `Cómo implementar Dobble en JavaScript para web.pdf`: implementación
  de referencia (no es el código actual, sólo material de consulta).
