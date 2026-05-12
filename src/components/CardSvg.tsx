import { layoutSymbols } from '../lib/layout';
import type { StoredImage } from '../lib/storage';

interface Props {
  card: number[];
  images: StoredImage[];
  seed: number;
  backgroundColor?: string;
  showCutLine?: boolean;
}

export function CardSvg({
  card,
  images,
  seed,
  backgroundColor = '#ffffff',
  showCutLine = true,
}: Props) {
  const layout = layoutSymbols(card.length, seed);
  const inner = 0.92;

  return (
    <div
      className="card-svg"
      data-cut-line={showCutLine}
      style={{ '--card-bg': backgroundColor } as React.CSSProperties}
    >
      {card.map((symbolId, i) => {
        const img = images[symbolId];
        if (!img) return null;
        const pos = layout[i];
        const w = pos.size * inner;
        const ratio = img.width / img.height || 1;
        const actualW = ratio >= 1 ? w : w * ratio;
        const actualH = ratio >= 1 ? w / ratio : w;
        const cx = pos.cx * inner;
        const cy = pos.cy * inner;
        const rotDeg = (pos.rotation * 180) / Math.PI;

        return (
          <img
            key={i}
            src={img.dataUrl}
            alt={img.name}
            className="card-symbol"
            style={{
              '--sym-left': `${((cx + 1) / 2) * 100}%`,
              '--sym-top': `${((cy + 1) / 2) * 100}%`,
              '--sym-w': `${(actualW / 2) * 100}%`,
              '--sym-h': `${(actualH / 2) * 100}%`,
              '--sym-rot': `${rotDeg}deg`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
