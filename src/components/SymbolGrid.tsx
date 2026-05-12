import type { StoredImage } from '../lib/storage';

interface Props {
  images: StoredImage[];
  onRemove: (id: string) => void;
}

export function SymbolGrid({ images, onRemove }: Props) {
  if (images.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>
        Todavía no agregaste símbolos.
      </p>
    );
  }
  return (
    <div className="symbol-grid">
      {images.map((img) => (
        <div className="symbol-cell" key={img.id} title={img.name}>
          <img src={img.dataUrl} alt={img.name} />
          <button
            type="button"
            className="remove"
            aria-label={`Eliminar ${img.name}`}
            onClick={() => onRemove(img.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
