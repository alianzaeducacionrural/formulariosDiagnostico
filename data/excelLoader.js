const ExcelJS = require("exceljs");
const path = require("path");

const ARCHIVOS = {
  escuela_nueva:   "formulario_escuela_nueva.xlsx",
  ppp:             "formulario_ppp.xlsx",
  escuela_virtual: "formulario_escuela_virtual.xlsx",
  emprendimiento:  "formulario_emprendimiento.xlsx",
};

function celdaATexto(cell) {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if (Array.isArray(v.richText)) return v.richText.map(r => r.text).join("");
    if (v instanceof Date) return v.toISOString();
    return String(v);
  }
  return String(v).trim();
}

async function cargarFormulario(clave, nombreArchivo) {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, "..", nombreArchivo);

  try {
    await wb.xlsx.readFile(filePath);
  } catch {
    console.warn(`[excelLoader] No se pudo leer ${nombreArchivo}`);
    return [];
  }

  const sheet = wb.worksheets[0];
  const filas = [];
  let idCounter = 0;

  // Leer encabezados (fila 1)
  const headers = {};
  sheet.getRow(1).eachCell((cell, col) => {
    headers[col] = celdaATexto(cell);
  });

  // Columnas de estrategias: col 4, 6, 8 … (pares: estrategia, observación)
  const estrategiasCols = [];
  for (let col = 4; headers[col] !== undefined; col += 2) {
    estrategiasCols.push({ nombre: headers[col], colEstado: col, colObs: col + 1 });
  }

  sheet.eachRow((row, rn) => {
    if (rn === 1) return;

    const municipio   = celdaATexto(row.getCell(1));
    const institucion = celdaATexto(row.getCell(2));
    const semaforo    = celdaATexto(row.getCell(3));

    if (!municipio && !institucion) return;

    idCounter++;
    // IDs únicos globales se asignan en loadAll()
    const estrategias = estrategiasCols.map(e => ({
      nombre:        e.nombre,
      estado:        celdaATexto(row.getCell(e.colEstado)),
      observaciones: celdaATexto(row.getCell(e.colObs)),
    }));

    filas.push({ _localId: idCounter, municipio, institucion, semaforo, estrategias });
  });

  return filas;
}

let cache = null;

async function loadAll() {
  if (cache) return cache;

  const result = {};
  let globalId = 0;

  for (const [clave, archivo] of Object.entries(ARCHIVOS)) {
    const filas = await cargarFormulario(clave, archivo);
    // Asignar IDs únicos entre todos los formularios
    filas.forEach(f => {
      globalId++;
      f.id = globalId;
    });
    result[clave] = filas;
  }

  cache = result;
  console.log("[excelLoader] Datos cargados:", Object.entries(result).map(([k, v]) => `${k}: ${v.length}`).join(", "));
  return cache;
}

function buscarPorId(data, id) {
  const numId = Number(id);
  for (const filas of Object.values(data)) {
    const found = filas.find(f => f.id === numId);
    if (found) return found;
  }
  return null;
}

module.exports = { loadAll, buscarPorId };
