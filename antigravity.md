# Dobble Card Generator — contexto para Antigravity

App web personal para generar mazos de cartas tipo **Dobble / Spot It!** con imágenes propias y descargarlos como PDF imprimible. Proyecto de Sergio, ubicado en `F:\Proyectos\Personal\Dobble`.

> Cualquier par de cartas comparte exactamente un símbolo. La base es el **plano proyectivo finito** de orden *n* — los símbolos son "puntos" y las cartas son "rectas".

## Estado actual

MVP funcional. Verificado:

- `npm test` → Tests en verde (validan la propiedad de coincidencia única para n=2,3,5,7).
- `npm run build` → Genera el bundle de producción en `dist/`.
- `npm run dev` → App servida en `http://localhost:5173`.

## Stack Tecnológico

- **Vite 5** + **React 18** + **TypeScript estricto** (`noUnusedLocals`, `noUnusedParameters`, `strict`).
- **pdf-lib** para generar PDF vectorial.
- **localStorage** para persistencia temporal (imágenes en base64 + configuración).
- **Vitest** para los tests del motor combinatorio.

## Estructura del Proyecto

```
F:\Proyectos\Personal\Dobble\
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.node.json
├── README.md
├── CLAUDE.md                      ← Contexto para Claude
├── antigravity.md                 ← Este archivo (Contexto para Antigravity)
├── Juego de cartas Doble.md       ← Notas de referencia teórica
├── Cómo implementar Dobble en JavaScript para web.pdf
└── src/
    ├── main.tsx                   ← Entrypoint de React
    ├── App.tsx                    ← UI principal (uploader + config + preview + PDF)
    ├── styles.css
    ├── lib/
    │   ├── dobble.ts              ← Motor combinatorio
    │   ├── dobble.test.ts         ← Tests del motor
    │   ├── layout.ts              ← Posiciones de símbolos dentro de la carta
    │   ├── storage.ts             ← Helpers de localStorage
    │   ├── defaults.ts            ← 15 SVGs inline de ejemplo
    │   └── pdf.ts                 ← Generación de PDF con pdf-lib
    └── components/
        ├── ImageUploader.tsx      ← Drag & drop + input file
        ├── SymbolGrid.tsx         ← Grilla de símbolos con gestión (eliminar)
        └── CardSvg.tsx            ← Preview SVG de una carta (espejo del PDF)
```

## Decisiones de Diseño Clave

### Motor Combinatorio (`src/lib/dobble.ts`)

- Soporta **n primo** (construcción cerrada mediante aritmética modular).
- `SUPPORTED_ORDERS = [2, 3, 5, 7]` → Genera mazos de 7, 13, 31 y 57 cartas respectivamente.
- La validación del mazo (`validateDeck`) asegura que cada par de cartas comparta exactamente 1 símbolo.

### Layout de Símbolos (`src/lib/layout.ts`)

- Determinístico basado en un `seed` numérico.
- Coordenadas normalizadas en un viewBox de -1 a 1.
- Configuración por anillos según la cantidad de símbolos.
- El preview (`CardSvg.tsx`) y el PDF (`pdf.ts`) comparten el mismo layout y seed para consistencia visual.

### Generación de PDF (`src/lib/pdf.ts`)

- **Cartas cuadradas** (grilla de 2x3 en hoja A4).
- Las cartas se tocan para facilitar cortes continuos.
- Las imágenes SVG se rasterizan a PNG (vía canvas) ya que `pdf-lib` no soporta SVG nativo.

### Persistencia (`src/lib/storage.ts`)

- Almacena imágenes (`StoredImage[]`) y configuración en `localStorage`.
- Claves: `dobble.images.v1` y `dobble.config.v1`.

## Guía de Uso (Comandos)

```bash
# Instalación de dependencias
npm install

# Desarrollo (Vite)
npm run dev

# Ejecución de tests (Vitest)
npm test

# Build de producción
npm run build
```

## Convenciones de Código

- **Idioma:** Comentarios y UI en español rioplatense.
- **TypeScript:** Estricto, evitar el uso de `any` a menos que sea estrictamente necesario y comentado.
- **Integridad:** El motor combinatorio es crítico; cualquier cambio debe validar que los tests sigan en verde.
- **Estilo:** Seguir el sistema de diseño definido en `styles.css` (Rich Aesthetics).

## Roadmap

- Soporte para cartas circulares/rectangulares.
- Categorías de imágenes predefinidas.
- Compartir configuraciones vía URL.
- Exportación como ZIP de imágenes individuales.
- Modo de juego online.

## Notas Operativas (Windows)

- El proyecto corre sobre Windows.
- Los comandos deben ejecutarse preferentemente desde PowerShell/CMD local.
