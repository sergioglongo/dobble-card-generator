import { useRef, useState } from 'react';
import { fileToStoredImage, type StoredImage } from '../lib/storage';

interface Props {
  onAdd: (images: StoredImage[]) => void;
  onError: (msg: string) => void;
}

export function ImageUploader({ onAdd, onError }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const results: StoredImage[] = [];
    for (const file of Array.from(files)) {
      try {
        const img = await fileToStoredImage(file);
        results.push(img);
      } catch (e) {
        onError((e as Error).message);
      }
    }
    if (results.length > 0) onAdd(results);
  }

  return (
    <div
      className={`uploader ${dragging ? 'dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handleFiles(e.dataTransfer.files);
      }}
    >
      <p style={{ fontWeight: 600 }}>Arrastrá imágenes acá o hacé clic para elegir</p>
      <p className="small">PNG, JPG o SVG · podés subir varias a la vez</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        multiple
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          // reset para permitir volver a subir el mismo archivo
          e.target.value = '';
        }}
      />
    </div>
  );
}
