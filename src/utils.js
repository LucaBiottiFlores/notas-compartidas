// Utilidades compartidas de la app de notas.

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

// Convierte HTML (posiblemente vacío o texto plano) a texto plano legible.
// Se usa para los snippets del listado y para el historial de versiones.
export function htmlToText(html) {
  if (!html) return '';
  let s = String(html);
  // Quitar estilos y scripts embebidos por completo.
  s = s.replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  // Reemplazar cada tag por un espacio para no pegar palabras.
  s = s.replace(/<[^>]+>/g, ' ');
  // Decodificar entidades HTML más comunes.
  s = s.replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (m, e) => ENTITIES['&' + e + ';'] ?? ' ');
  // Colapsar espacios y recortar.
  return s.replace(/\s+/g, ' ').trim();
}
