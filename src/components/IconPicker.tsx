import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import type { StoredImage } from '../lib/storage';

interface Props {
  onAdd: (images: StoredImage[]) => void;
  onError: (msg: string) => void;
}

interface IconifySearchResult {
  icons: string[];
  total: number;
}

export function IconPicker({ onAdd, onError }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Iconos iniciales (algunos de Noto Emoji para que no esté vacío)
  const defaultIcons = [
    'noto:dog', 'noto:cat', 'noto:rabbit', 'noto:fox', 'noto:lion',
    'noto:tiger', 'noto:horse', 'noto:unicorn', 'noto:cow', 'noto:pig',
    'noto:frog', 'noto:octopus', 'noto:whale', 'noto:monkey', 'noto:chicken',
    'noto:penguin', 'noto:bird', 'noto:owl', 'noto:bat', 'noto:butterfly'
  ];

  const searchIcons = useCallback(async (q: string) => {
    if (!q) {
      setResults(defaultIcons);
      return;
    }
    setLoading(true);
    try {
      // Filtramos por colecciones que sabemos que son de colores (emojis e iconos flat)
      const coloredPrefixes = ['noto', 'twemoji', 'fluent-emoji', 'flat-color-icons', 'openmoji', 'fxemoji', 'logos'];
      const response = await fetch(
        `https://api.iconify.design/search?query=${encodeURIComponent(q)}&prefixes=${coloredPrefixes.join(',')}&limit=32`
      );
      const data = (await response.json()) as IconifySearchResult;
      setResults(data.icons || []);
    } catch (e) {
      onError('Error buscando iconos');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void searchIcons(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, searchIcons]);

  async function handleSelectIcon(iconName: string) {
    try {
      const [prefix, name] = iconName.includes(':') ? iconName.split(':') : ['noto', iconName];
      const response = await fetch(`https://api.iconify.design/${prefix}/${name}.svg`);
      let svgText = await response.text();

      // Forzar que el SVG use el 100% del contenedor para que no se vea pequeño
      // Eliminamos width/height previos e inyectamos los nuevos
      svgText = svgText.replace(/<svg([^>]*)>/, (match, body) => {
        const cleanBody = body.replace(/\b(width|height)=["'][^"']*["']/g, '').trim();
        return `<svg ${cleanBody} width="100%" height="100%">`;
      });

      // Convertir SVG a Data URL
      const base64 = btoa(unescape(encodeURIComponent(svgText)));
      const dataUrl = `data:image/svg+xml;base64,${base64}`;

      onAdd([{
        id: `icon-${prefix}-${name}-${Math.random().toString(36).slice(2, 7)}`,
        name: `${name} (icon)`,
        dataUrl,
        mime: 'image/svg+xml',
        width: 256, // Iconos de iconify suelen ser cuadrados
        height: 256,
        addedAt: Date.now()
      }]);
    } catch (e) {
      onError('No se pudo cargar el icono seleccionado');
    }
  }

  return (
    <div className="icon-picker">
      <div className="field">
        <label>Buscar Iconos</label>
        <input
          type="text"
          placeholder="Ej: dog, pizza, star..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="icon-results">
        {loading ? (
          <div className="loading-dots">Buscando...</div>
        ) : results.length > 0 ? (
          results.map((icon) => (
            <button
              key={icon}
              type="button"
              className="icon-btn"
              onClick={() => void handleSelectIcon(icon)}
              title={icon}
            >
              <Icon icon={icon} width="32" height="32" />
            </button>
          ))
        ) : (
          <p className="small">No se encontraron iconos.</p>
        )}
      </div>
    </div>
  );
}
