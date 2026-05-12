/**
 * Persistencia temporal de imágenes y configuración en localStorage.
 *
 * Las imágenes se guardan como data URLs (base64). El límite práctico
 * de localStorage suele ser ~5 MB total, por lo que la app advierte al
 * usuario si se acerca al límite.
 */

export interface StoredImage {
  id: string;
  name: string;
  /** data URL base64, listo para <img src> y para embeber en PDF */
  dataUrl: string;
  /** "image/png" o "image/svg+xml" o "image/jpeg" */
  mime: string;
  /** ancho/alto detectados al cargar */
  width: number;
  height: number;
  /** timestamp ms */
  addedAt: number;
}

export interface AppConfig {
  /** orden n del plano proyectivo. */
  order: number;
  /** seed para layout determinista. */
  seed: number;
  /** mostrar borde de las cartas en el PDF (línea de recorte). */
  showCutLine: boolean;
  /** color de fondo de las cartas. */
  backgroundColor: string;
}

const KEY_IMAGES = 'dobble.images.v1';
const KEY_CONFIG = 'dobble.config.v1';

export const DEFAULT_CONFIG: AppConfig = {
  order: 5,
  seed: 1,
  showCutLine: true,
  backgroundColor: '#ffffff',
};

export function loadImages(): StoredImage[] {
  try {
    const raw = localStorage.getItem(KEY_IMAGES);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredImage[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveImages(images: StoredImage[]): { ok: boolean; error?: string } {
  try {
    localStorage.setItem(KEY_IMAGES, JSON.stringify(images));
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof DOMException && e.name === 'QuotaExceededError'
          ? 'Se llenó el almacenamiento del navegador. Borrá imágenes para liberar espacio.'
          : `No se pudo guardar: ${(e as Error).message}`,
    };
  }
}

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(KEY_CONFIG);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(cfg: AppConfig): void {
  try {
    localStorage.setItem(KEY_CONFIG, JSON.stringify(cfg));
  } catch {
    // no es crítico si falla
  }
}

export function clearAll(): void {
  localStorage.removeItem(KEY_IMAGES);
  localStorage.removeItem(KEY_CONFIG);
}

/**
 * Estima el espacio ocupado por las imágenes en bytes.
 */
export function estimateImagesSize(images: StoredImage[]): number {
  // 1 char ~ 1 byte para data URLs base64
  let total = 0;
  for (const img of images) total += img.dataUrl.length + img.name.length + 64;
  return total;
}

/**
 * Lee un File y lo convierte a StoredImage con dataUrl + dimensiones.
 */
export function fileToStoredImage(file: File): Promise<StoredImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(`"${file.name}" no es una imagen.`));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Error leyendo archivo'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // detectar dimensiones
      const img = new Image();
      img.onerror = () => reject(new Error(`No se pudo decodificar "${file.name}".`));
      img.onload = () => {
        resolve({
          id: cryptoRandomId(),
          name: file.name,
          dataUrl,
          mime: file.type,
          width: img.naturalWidth || 256,
          height: img.naturalHeight || 256,
          addedAt: Date.now(),
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
