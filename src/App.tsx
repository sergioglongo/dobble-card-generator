import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  generateDeck,
  deckStats,
  SUPPORTED_ORDERS,
  shuffle,
  type Deck,
} from './lib/dobble';
import {
  loadImages,
  saveImages,
  loadConfig,
  saveConfig,
  type StoredImage,
  type AppConfig,
  estimateImagesSize,
} from './lib/storage';
import { defaultImages } from './lib/defaults';
import { generatePdf, downloadPdf } from './lib/pdf';
import { ImageUploader } from './components/ImageUploader';
import { SymbolGrid } from './components/SymbolGrid';
import { CardSvg } from './components/CardSvg';

export default function App() {
  const [images, setImages] = useState<StoredImage[]>(() => {
    const stored = loadImages();
    return stored.length > 0 ? stored : defaultImages();
  });
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const res = saveImages(images);
    if (!res.ok) setWarning(res.error ?? null);
    else setWarning(null);
  }, [images]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const stats = useMemo(() => deckStats(config.order), [config.order]);
  const hasEnough = images.length >= stats.symbols;

  // Mejor orden posible con las imágenes actuales (null si ni siquiera alcanza para n=2)
  const bestAvailableOrder = useMemo(
    () => [...SUPPORTED_ORDERS].reverse().find((n) => images.length >= n * n + n + 1) ?? null,
    [images.length],
  );

  const deck: Deck = useMemo(() => {
    if (!hasEnough) return [];
    const raw = generateDeck(config.order);
    const rng = mulberry32(config.seed >>> 0 || 1);
    const ids = shuffle(
      Array.from({ length: stats.symbols }, (_, i) => i),
      rng,
    );
    return raw.map((card) => shuffle(card.map((id) => ids[id]), rng));
  }, [config.order, config.seed, stats.symbols, hasEnough]);

  const handleAdd = useCallback((newOnes: StoredImage[]) => {
    setImages((prev) => [...prev, ...newOnes]);
  }, []);
  const handleRemove = useCallback((id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
  }, []);
  const resetDefaults = useCallback(() => {
    if (confirm('Esto reemplaza las imágenes cargadas por las de ejemplo. ¿Seguir?')) {
      setImages(defaultImages());
    }
  }, []);
  const clearAll = useCallback(() => {
    if (confirm('Esto borra todas las imágenes cargadas. ¿Seguir?')) {
      setImages([]);
    }
  }, []);
  const reroll = useCallback(() => {
    setConfig((c) => ({ ...c, seed: Math.floor(Math.random() * 1e9) }));
  }, []);

  const onGeneratePdf = useCallback(async () => {
    if (!hasEnough || deck.length === 0) return;
    setError(null);
    setGenerating(true);
    setProgress(0.05);
    try {
      const bytes = await generatePdf(images, deck, {
        seed: config.seed,
        showCutLine: config.showCutLine,
        backgroundColor: hexToRgb(config.backgroundColor),
        onProgress: setProgress,
      });
      const ord = config.order;
      downloadPdf(bytes, `dobble-n${ord}-${deck.length}cartas.pdf`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  }, [hasEnough, deck, images, config]);

  const storageInfoKb = Math.round(estimateImagesSize(images) / 1024);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Dobble Card Generator</h1>
        <p>
          Generá tu propio mazo tipo Dobble / Spot It! con tus imágenes y
          descargalo en PDF listo para imprimir y recortar.
        </p>
      </header>

      {error && <div className="alert">{error}</div>}
      {warning && <div className="warning">{warning}</div>}

      <section className="section">
        <div className="section-header">
          <h2>1. Tus símbolos</h2>
          <span className="hint">
            {images.length} imágenes · {storageInfoKb} KB en localStorage
          </span>
        </div>
        <ImageUploader onAdd={handleAdd} onError={setError} />
        <SymbolGrid images={images} onRemove={handleRemove} />
        <div className="toolbar" style={{ marginTop: 14 }}>
          <button type="button" className="btn" onClick={resetDefaults}>
            Cargar ejemplos
          </button>
          <button type="button" className="btn danger" onClick={clearAll}>
            Borrar todo
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>2. Configuración del mazo</h2>
        </div>
        <div className="config-row">
          <div className="field">
            <label htmlFor="order">Tamaño del mazo</label>
            <select
              id="order"
              value={config.order}
              onChange={(e) =>
                setConfig((c) => ({ ...c, order: Number(e.target.value) }))
              }
            >
              {SUPPORTED_ORDERS.map((n) => {
                const s = deckStats(n);
                return (
                  <option key={n} value={n}>
                    n={n} · {s.cards} cartas · {s.symbolsPerCard} símbolos/carta
                  </option>
                );
              })}
            </select>
          </div>
          <div className="field">
            <label htmlFor="bg">Fondo</label>
            <input
              id="bg"
              type="color"
              value={config.backgroundColor}
              onChange={(e) =>
                setConfig((c) => ({ ...c, backgroundColor: e.target.value }))
              }
            />
          </div>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={config.showCutLine}
              onChange={(e) =>
                setConfig((c) => ({ ...c, showCutLine: e.target.checked }))
              }
            />
            Línea de recorte
          </label>
          <button type="button" className="btn" onClick={reroll} title="Mezclar layout">
            ♻ Mezclar layout
          </button>
        </div>

        <div className="deck-stats">
          <div className="stat">
            <span className="label">Cartas</span>
            <span className="value">{stats.cards}</span>
          </div>
          <div className="stat">
            <span className="label">Símbolos por carta</span>
            <span className="value">{stats.symbolsPerCard}</span>
          </div>
          <div className="stat">
            <span className="label">Símbolos necesarios</span>
            <span className="value">{stats.symbols}</span>
          </div>
          <div className="stat">
            <span className="label">Imágenes cargadas</span>
            <span className="value">{images.length}</span>
          </div>
        </div>
        {!hasEnough && (
          <div className="warning" style={{ marginTop: 12 }}>
            Te faltan {stats.symbols - images.length} imagen
            {stats.symbols - images.length !== 1 ? 'es' : ''} para n={config.order}. En
            Dobble, símbolos = cartas (propiedad del plano proyectivo).{' '}
            {bestAvailableOrder !== null ? (
              <>
                Con las {images.length} que tenés podés usar{' '}
                <button
                  type="button"
                  className="btn-link"
                  onClick={() =>
                    setConfig((c) => ({ ...c, order: bestAvailableOrder }))
                  }
                >
                  n={bestAvailableOrder} → {deckStats(bestAvailableOrder).cards} cartas
                </button>
                .
              </>
            ) : (
              'Subí al menos 7 imágenes para el mazo más chico (n=2).'
            )}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-header">
          <h2>3. Vista previa</h2>
          <span className="hint">
            {deck.length > 0
              ? `Mostrando ${Math.min(deck.length, 12)} de ${deck.length} cartas`
              : 'Sin mazo todavía'}
          </span>
        </div>
        {deck.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Cuando tengas imágenes suficientes vas a ver acá la vista previa
            de las cartas.
          </p>
        ) : (
          <div className="preview-grid">
            {deck.slice(0, 12).map((card, i) => (
              <div className="card-wrapper" key={i}>
                <CardSvg
                  card={card}
                  images={images}
                  seed={config.seed + i * 7919}
                  backgroundColor={config.backgroundColor}
                  showCutLine={config.showCutLine}
                />
                <span className="card-index">#{i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-header">
          <h2>4. Descargar PDF</h2>
        </div>
        <div className="toolbar">
          <button
            type="button"
            className="btn primary"
            disabled={!hasEnough || generating}
            onClick={() => void onGeneratePdf()}
          >
            {generating ? 'Generando…' : `Descargar PDF (${deck.length} cartas)`}
          </button>
          <span className="hint">
            A4 · 6 cartas cuadradas por hoja · líneas de corte continuas
          </span>
        </div>
        {generating && (
          <div className="progress" aria-label="progreso">
            <div className="progress-bar" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        )}
      </section>

      <footer className="app-footer">
        Hecho con plano proyectivo finito de orden n.
        Cualquier par de cartas comparte exactamente un símbolo.
      </footer>
    </div>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return { r, g, b };
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
