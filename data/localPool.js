/**
 * Reemplaza pg.Pool leyendo los archivos Excel locales.
 * Implementa query(sql, params) con los mismos patrones que usa index.js.
 */
const { loadAll, buscarPorId } = require("./excelLoader");

let dataPromise = null;

async function getData() {
  if (!dataPromise) dataPromise = loadAll();
  return dataPromise;
}

function agruparPorEstrategia(filas) {
  const map = {};
  filas.forEach(f => {
    f.estrategias.forEach(e => {
      if (!map[e.nombre]) map[e.nombre] = { aplica: 0, no_aplica: 0 };
      if (e.estado === "Aplica")    map[e.nombre].aplica++;
      if (e.estado === "No aplica") map[e.nombre].no_aplica++;
    });
  });
  return map;
}

function agruparPorInstitucion(filas) {
  const map = {};
  filas.forEach(f => {
    const key = `${f.municipio}|||${f.institucion}`;
    if (!map[key]) map[key] = { institucion: f.institucion, municipio: f.municipio, aplica: 0, no_aplica: 0 };
    f.estrategias.forEach(e => {
      if (e.estado === "Aplica")    map[key].aplica++;
      if (e.estado === "No aplica") map[key].no_aplica++;
    });
  });
  return map;
}

const pool = {
  query: async (sql, params = []) => {
    const data = await getData();
    // Normalizar SQL para facilitar la comparación
    const s = sql.replace(/\s+/g, " ").trim();

    // ── Health checks ─────────────────────────────────────────────────────────
    if (/^SELECT\s+1/i.test(s) || /^SELECT\s+NOW\(\)/i.test(s)) {
      return { rows: [{ "?column?": 1, now: new Date() }] };
    }

    // ── COUNT de respuestas por formulario ────────────────────────────────────
    if (s.includes("COUNT(") && s.includes("FROM respuestas") && !s.includes("estrategias")) {
      const formulario = params[0];
      return { rows: [{ total: (data[formulario] || []).length }] };
    }

    // ── DISTINCT nombre_estrategia (para export) ──────────────────────────────
    if (s.includes("DISTINCT nombre_estrategia")) {
      const formulario = params[0];
      const filas = data[formulario] || [];
      const nombres = new Set();
      filas.forEach(f => f.estrategias.forEach(e => nombres.add(e.nombre)));
      return { rows: [...nombres].sort().map(nombre_estrategia => ({ nombre_estrategia })) };
    }

    // ── Resumen por estrategia (GROUP BY nombre_estrategia) ───────────────────
    if (s.includes("GROUP BY nombre_estrategia")) {
      const formulario = params[0];
      const filas = data[formulario] || [];
      const map = agruparPorEstrategia(filas);
      const rows = Object.entries(map)
        .map(([nombre_estrategia, v]) => ({ nombre_estrategia, aplica: v.aplica, no_aplica: v.no_aplica }))
        .sort((a, b) => a.nombre_estrategia.localeCompare(b.nombre_estrategia));
      return { rows };
    }

    // ── Ranking por institución (GROUP BY r.institucion, r.municipio) ─────────
    if (s.includes("GROUP BY r.institucion")) {
      const formulario = params[0];
      const filas = data[formulario] || [];
      return { rows: Object.values(agruparPorInstitucion(filas)) };
    }

    // ── Detalle completo de una respuesta (municipio + nombre_estrategia + obs) ─
    if (s.includes("municipio") && s.includes("nombre_estrategia") && s.includes("observaciones") && s.includes("respuesta_id = $1")) {
      const found = buscarPorId(data, params[0]);
      if (!found) return { rows: [] };
      return {
        rows: found.estrategias.map(e => ({
          municipio:        found.municipio,
          institucion:      found.institucion,
          nombre_estrategia: e.nombre,
          estado:           e.estado,
          observaciones:    e.observaciones,
        })),
      };
    }

    // ── nombre_estrategia + estado + observaciones por respuesta (export) ──────
    if (s.includes("nombre_estrategia") && s.includes("observaciones") && s.includes("respuesta_id = $1")) {
      const found = buscarPorId(data, params[0]);
      if (!found) return { rows: [] };
      return {
        rows: found.estrategias.map(e => ({
          nombre_estrategia: e.nombre,
          estado:            e.estado,
          observaciones:     e.observaciones,
        })),
      };
    }

    // ── Solo estado por respuesta_id (loop semáforo en /admin/formulario) ──────
    if (s.includes("SELECT estado") && s.includes("respuesta_id = $1")) {
      const found = buscarPorId(data, params[0]);
      if (!found) return { rows: [] };
      return { rows: found.estrategias.map(e => ({ estado: e.estado })) };
    }

    // ── Todas las respuestas del formulario (con nombre/fecha) — vista admin ───
    if (s.includes("FROM respuestas") && s.includes("formulario = $1") && (s.includes("nombre") || s.includes("fecha"))) {
      const formulario = params[0];
      const rows = (data[formulario] || []).map(f => ({
        id:          f.id,
        nombre:      f.institucion,
        municipio:   f.municipio,
        institucion: f.institucion,
        fecha:       new Date("2025-01-01"),
      }));
      return { rows };
    }

    // ── Respuestas para export (id, municipio, institucion) ───────────────────
    if (s.includes("FROM respuestas") && s.includes("formulario = $1") && s.includes("municipio") && s.includes("institucion")) {
      const formulario = params[0];
      const rows = (data[formulario] || []).map(f => ({ id: f.id, municipio: f.municipio, institucion: f.institucion }));
      return { rows };
    }

    console.warn("[localPool] Query no manejada:", s.slice(0, 120));
    return { rows: [] };
  },
};

module.exports = pool;
