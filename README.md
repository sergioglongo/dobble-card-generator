# Dobble Card Generator

Generador web de cartas tipo **Dobble / Spot It!** con tus propias imágenes.
Cada mazo se construye con un **plano proyectivo finito** de orden *n*, así
cada par de cartas comparte exactamente un símbolo.

## Stack

- Vite + React + TypeScript
- pdf-lib (generación PDF vectorial)
- localStorage para persistencia temporal de imágenes
- Vitest para tests del motor combinatorio

## Tamaños soportados (MVP)

| n | Cartas | Símbolos | Símbolos por carta |
|---|--------|----------|--------------------|
| 2 |   7    |    7     |         3          |
| 3 |  13    |   13     |         4          |
| 5 |  31    |   31     |         6          |
| 7 |  57    |    57    |         8          |

> Para órdenes no primos (n=4, n=6, …) la construcción cerrada no es válida.
> Se podría agregar más adelante con búsqueda heurística.

## Cómo correrlo

```bash
# desde Windows / PowerShell, en F:\Proyectos\Personal\Dobble:
npm install
npm run dev       # arranca Vite en http://localhost:5173
npm test          # corre los tests del motor combinatorio
npm run build     # build de producción a /dist
```

> **Nota:** la carpeta `node_modules` que pudiera existir antes del primer
> `npm install` propio quizás esté incompleta. Si `npm run dev` falla con
> un error tipo `Cannot find module`, borrá `node_modules` y reinstalá.

### Verificado (al cierre del MVP)

- `npm test` → 20 tests, todos en verde (valida que para n=2,3,5,7 cada par
  de cartas comparte exactamente un símbolo).
- `npm run build` → bundle ~ 590 KB (≈ 230 KB gzip).

## Estructura

```
src/
  main.tsx                  # entrypoint React
  App.tsx                   # UI principal
  styles.css                # estilos
  lib/
    dobble.ts               # motor combinatorio (plano proyectivo)
    dobble.test.ts          # tests
    layout.ts               # posicionamiento de símbolos en la carta
    storage.ts              # localStorage
    defaults.ts             # 15 SVGs de ejemplo
    pdf.ts                  # generación PDF con pdf-lib
  components/
    ImageUploader.tsx
    SymbolGrid.tsx
    CardSvg.tsx
```

## Flujo

1. **Subí imágenes** (PNG / JPG / SVG) o usá las de ejemplo.
2. **Elegí el tamaño** del mazo (n=2 a n=7).
3. **Vista previa** en pantalla con el mismo layout que va al PDF.
4. **Descargá el PDF** (A4, 6 cartas cuadradas por hoja con líneas de corte continuas).

## Roadmap (post-MVP)

- Variar tamaño/forma de las cartas (cuadradas, rectangulares).
- Categorías temáticas predefinidas (animales, frutas, oficinas, etc.).
- Compartir mazos vía URL (códigos base64 comprimidos).
- Soporte para órdenes no primos con búsqueda heurística.
- Exportar como ZIP con PNGs individuales (para impresión bajo demanda).
- Modo "juego online" para jugar entre dos personas.
