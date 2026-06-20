// ============================================================
// Google Apps Script — Encuestas Diagnóstico Proyectos
// ============================================================
// Desplegar como Web App (Anyone with link → access).
// Copiar la URL desplegada a js/config.js como GAS_URL.
// ============================================================

// ── Mapping de slug → nombre de hoja en el spreadsheet ─────
var SHEET_NAMES = {
  escuela_nueva:   "Escuela Nueva",
  ppp:             "PPP",
  escuela_virtual: "Escuela Virtual",
  emprendimiento:  "Emprendimiento",
  alianza_era:     "Alianza ERA"
};

// ── Estrategias de Alianza ERA (definidas en código) ───────
var ALIANZA_ESTRATEGIAS = [
  "Ambientación de las aulas",
  "Hora de Gestión de Negocios",
  "Manejo de instrumentos de gobierno estudiantil",
  "Operatividad del Gobierno Estudiantil",
  "Organización de los docentes en Microcentro",
  "Realización de actividades de conjunto",
  "Trabajo en equipo",
  "Uso de guías de interaprendizaje con Escuela Nueva"
];

var RECOMENDACIONES_LABEL = "Recomendaciones para la alianza frente a la formación, asesoría y acompañamiento";

// ── Catálogo de formularios (títulos, descripciones) ───────
var FORM_CATALOG = {
  escuela_nueva: {
    title: "¿Cómo estamos? ¿Cómo vamos?",
    subtitle: "Modelo Escuela Nueva",
    description: "<strong>Apreciado Rector(a)</strong><p>Con el propósito de tomar decisiones pertinentes frente a las acciones de formación, asesoría y acompañamiento a desarrollar en las instituciones educativas que aplican el modelo educativo rural con Escuela Nueva, le invitamos a diligenciar el siguiente formulario diagnóstico.</p>"
  },
  ppp: {
    title: "Proyectos Pedagógicos Productivos (PPP)",
    subtitle: "PPP",
    description: "<strong>Apreciado Rector(a) y/o docente líder</strong><p>Con el propósito de tomar decisiones pertinentes frente a las acciones de formación, asesoría y acompañamiento a desarrollar en las instituciones educativas que aplican los Proyectos Pedagógicos Productivos, le invitamos a diligenciar el siguiente formulario diagnóstico.</p>"
  },
  escuela_virtual: {
    title: "Escuela Virtual",
    subtitle: "Escuela Virtual",
    description: "<strong>Apreciado Rector(a) y/o docente líder</strong><p>Con el propósito de tomar decisiones pertinentes frente a las acciones de formación, asesoría y acompañamiento a desarrollar en las instituciones educativas que aplican el proyecto Escuela Virtual, le invitamos a diligenciar el siguiente formulario diagnóstico.</p>"
  },
  emprendimiento: {
    title: "Emprendimiento",
    subtitle: "Emprendimiento",
    description: "<strong>Apreciado Rector(a) y/o docente líder</strong><p>Con el propósito de tomar decisiones pertinentes frente a las acciones de formación, asesoría y acompañamiento a desarrollar en las instituciones educativas que aplican la línea de Emprendimiento, le invitamos a diligenciar el siguiente formulario diagnóstico.</p>"
  },
  alianza_era: {
    title: "Alianza ERA",
    subtitle: "Alianza ERA",
    description: "<strong>Apreciado Rector(a) o Docente</strong><p>Con el propósito de tomar decisiones pertinentes frente a las acciones de formación, asesoría y acompañamiento que desarrolla la Alianza ERA en las instituciones educativas, le invitamos a diligenciar el siguiente formulario diagnóstico.</p>",
    libreUbicacion: true,
    pideCargo: true,
    pideRecomendaciones: true,
    recomendacionesLabel: RECOMENDACIONES_LABEL,
    strategies: ALIANZA_ESTRATEGIAS
  }
};

// ── Tipos de estrategias conocidas (por nombre exacto) ─────
// Por defecto "aplica"; las que listamos aquí son "numero".
var STRATEGY_TIPOS = {
  "Dinero existente": "numero",
  "Número de proyectos apoyados en el 2025": "numero"
};

// ── Municipios e instituciones (misma data que el original) ─
var MUNICIPIOS = {
  "Aguadas":    ["El Edén","Encimadas","La Mermita","Rioarriba","San Antonio de Arma","Viboral"],
  "Anserma":    ["Alto Nubia","El Horro","Gómez Fernandez","Jerónimo de Tejelo","Juan XXIII","Ocuzca","San Pedro"],
  "Aranzazu":   ["Alegrías","Juan Crisóstomo Osorio","Pío XI"],
  "Belalcázar": ["El Águila","El Madroño","San Isidro"],
  "Chinchiná":  ["Eduardo Gómez Arrubla","El Trébol","Naranjal"],
  "Filadelfia": ["Antonio Nariño","Crisanto Luque"],
  "La Dorada":  ["Buenavista","El Japón","Purnio"],
  "La Merced":  ["La Felisa","Llanadas"],
  "Manizales":  ["Adolfo Hoyos Ocampo","Giovanni Montini","Granada","José Antonio Galán","La Cabaña","La Linda","La Palma","La Trinidad","La Violeta","Maltería","María Goretti","Miguel Antonio Caro","Rafael Pombo","San Peregrino","Seráfico San Antonio de Padua"],
  "Manzanares": ["Aguabonita","Gregorio Gutiérrez González","José Antonio Galán","Llanadas","Manzanares","Romeral"],
  "Marmato":    ["Cabras","El Llano","General Ramón Marín","Marmato","Rafael Pombo"],
  "Marquetalia":["Antonio María Hincapié","El Placer","La Quiebra","Patio Bonito"],
  "Marulanda":  ["Efrén Cardona Chica","Montebonito"],
  "Neira":      ["Aguacatal","El Roble","Llanogrande","Pío XII","Pueblo Rico","San Luis"],
  "Norcasia":   ["La Estrella"],
  "Pácora":     ["Francisco José de Caldas","La Milagrosa","Las Coles","Mariscal Robledo"],
  "Palestina":  ["Cartagena","José María Carbonell","Santágueda"],
  "Pensilvania":["Camilo Olimpo Cardona","Daniel María López Rodríguez","Francisco Julian Olaya","Guacas","John F. Kennedy","La Rioja","Pablo VI","Santa Rita"],
  "Riosucio":   ["Florencia","Nuestra Señora de Fátima"],
  "Risaralda":  ["Francisco José de Caldas","Gabriel García Márquez","Quiebra de Santa Barbara"],
  "Salamina":   ["El Perro","Luis Felipe Gutiérrez Loaiza","San Félix"],
  "Samaná":     ["Dulce Nombre","El Bosque","El Silencio","Encimadas","Félix Naranjo","Pío XII","Rancho Largo"],
  "San José":   ["La Libertad"],
  "Supía":      ["Hojas Anchas","Obispo"],
  "Victoria":   ["Cañaveral","Isaza"],
  "Villamaría": ["Colombia","Fortunato Gaviria Botero","Partidas","Pío XII"],
  "Viterbo":    ["El Socorro"]
};

// ── Semáforo ───────────────────────────────────────────────
function calcularSemaforo(aplica, noAplica) {
  var total = aplica + noAplica || 1;
  var pct = (aplica / total) * 100;
  if (pct < 50) return "Rojo";
  if (pct < 75) return "Amarillo";
  return "Verde";
}

// ── Helpers de respuesta ───────────────────────────────────
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Metadata de columnas por formulario ────────────────────
// Layout estándar:  [Municipio, Institución, Semáforo, est/obs...]
// Layout alianza:   [Municipio, Institución, Semáforo, Nombre, Cargo, est/obs..., Recomendaciones]
function getFormMeta(slug) {
  if (slug === "alianza_era") {
    return { estStart: 5, nombreCol: 3, cargoCol: 4 };
  }
  return { estStart: 3, nombreCol: -1, cargoCol: -1 };
}

// ── Estrategias del formulario ─────────────────────────────
// Si el catálogo define strategies, se usan esas; si no, se leen
// de los encabezados de la hoja.
function getStrategies(slug, sheet) {
  var cat = FORM_CATALOG[slug] || {};
  if (cat.strategies) {
    return cat.strategies.map(function(n) {
      return { nombre: n, tipo: STRATEGY_TIPOS[n] || "aplica" };
    });
  }
  return sheet ? leerEstrategiasDeHoja(sheet) : [];
}

// ── Leer headers y extraer estrategias de una hoja ─────────
function leerEstrategiasDeHoja(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var estrategias = [];
  for (var col = 3; col < headers.length; col += 2) {
    var nombre = String(headers[col] || "").trim();
    if (!nombre) continue;
    var obsHeader = String(headers[col + 1] || "").trim();
    if (obsHeader.indexOf("Observaci") === -1) continue;
    estrategias.push({
      nombre: nombre,
      tipo: STRATEGY_TIPOS[nombre] || "aplica"
    });
  }
  return estrategias;
}

// ── Obtener sheet por slug (crea Alianza ERA si falta) ──────
function getSheet(slug) {
  var name = SHEET_NAMES[slug];
  if (!name) throw new Error("Formulario desconocido: " + slug);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    if (slug === "alianza_era") return crearHojaAlianza(ss);
    throw new Error("Hoja no encontrada: " + name);
  }
  return sheet;
}

// ── Encabezados de la hoja Alianza ERA ─────────────────────
function encabezadosAlianza() {
  var headers = ["Municipio", "Institución", "Semáforo", "Nombre", "Cargo"];
  ALIANZA_ESTRATEGIAS.forEach(function(n) {
    headers.push(n);
    headers.push("Observaciones - " + n);
  });
  headers.push(RECOMENDACIONES_LABEL);
  return headers;
}

// ── Escribir encabezados en una hoja (fila 1) ──────────────
function escribirEncabezadosAlianza(sheet) {
  var headers = encabezadosAlianza();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

// ── Crear hoja Alianza ERA con sus encabezados ─────────────
function crearHojaAlianza(ss) {
  var sheet = ss.insertSheet(SHEET_NAMES.alianza_era);
  return escribirEncabezadosAlianza(sheet);
}

// ── Reparar/escribir encabezados en la hoja Alianza ERA ────
// Ejecutar UNA vez desde el editor de Apps Script (botón Run)
// si la hoja ya existía sin encabezados. No requiere redesplegar.
function repararEncabezadosAlianza() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.alianza_era);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAMES.alianza_era);
  escribirEncabezadosAlianza(sheet);
  return "Encabezados de '" + SHEET_NAMES.alianza_era + "' actualizados.";
}

// ── GET /?action=getConfig ─────────────────────────────────
function handleGetConfig() {
  var forms = {};
  for (var slug in SHEET_NAMES) {
    var cat = FORM_CATALOG[slug] || {};
    var strategies;
    try {
      var sheet = getSheet(slug);
      strategies = getStrategies(slug, sheet);
    } catch (e) {
      strategies = getStrategies(slug, null);
    }
    forms[slug] = {
      title: cat.title,
      subtitle: cat.subtitle,
      description: cat.description,
      strategies: strategies,
      pideCargo: !!cat.pideCargo,
      pideRecomendaciones: !!cat.pideRecomendaciones,
      libreUbicacion: !!cat.libreUbicacion,
      recomendacionesLabel: cat.recomendacionesLabel || RECOMENDACIONES_LABEL
    };
  }

  return jsonResponse({
    forms: forms,
    municipios: MUNICIPIOS
  });
}

// ── GET /?action=getFormData&form=slug ─────────────────────
function handleGetFormData(slug) {
  var sheet = getSheet(slug);
  var meta = getFormMeta(slug);
  var cat = FORM_CATALOG[slug] || {};
  var strategies = getStrategies(slug, sheet);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse({ rows: [], strategies: strategies });

  var recCol = meta.estStart + strategies.length * 2;
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var estrategias = [];
    var aplica = 0, noAplica = 0;

    for (var s = 0; s < strategies.length; s++) {
      var colEst = meta.estStart + s * 2;
      var colObs = colEst + 1;
      var estado = String(row[colEst] || "").trim();
      var obs = String(row[colObs] || "").trim();

      if (strategies[s].tipo === "aplica") {
        if (estado === "Aplica") aplica++;
        if (estado === "No aplica") noAplica++;
      }

      estrategias.push({
        nombre: strategies[s].nombre,
        tipo: strategies[s].tipo,
        estado: estado,
        observaciones: obs
      });
    }

    // Usar semáforo almacenado si existe; si no, calcular
    var semaforoAlmacenado = String(row[2] || "").trim();
    var semaforo = semaforoAlmacenado || calcularSemaforo(aplica, noAplica);

    var obj = {
      id: i,
      municipio: String(row[0] || "").trim(),
      institucion: String(row[1] || "").trim(),
      semaforo: semaforo,
      estrategias: estrategias
    };
    if (meta.nombreCol >= 0) obj.nombre = String(row[meta.nombreCol] || "").trim();
    if (meta.cargoCol >= 0) obj.cargo = String(row[meta.cargoCol] || "").trim();
    if (cat.pideRecomendaciones) obj.recomendaciones = String(row[recCol] || "").trim();

    rows.push(obj);
  }

  return jsonResponse({
    rows: rows,
    strategies: strategies
  });
}

// ── GET /?action=getAdminSummary ───────────────────────────
function handleGetAdminSummary() {
  var summary = {};
  for (var slug in SHEET_NAMES) {
    try {
      var sheet = getSheet(slug);
      var lastRow = sheet.getLastRow();
      summary[slug] = { total: Math.max(0, lastRow - 1) };
    } catch (e) {
      summary[slug] = { total: 0 };
    }
  }
  return jsonResponse(summary);
}

// ── GET /?action=getDetalle&id=X&form=slug ─────────────────
function handleGetDetalle(id, formSlug) {
  var slugs = formSlug ? [formSlug] : Object.keys(SHEET_NAMES);

  for (var si = 0; si < slugs.length; si++) {
    var slug = slugs[si];
    try {
      var sheet = getSheet(slug);
      var meta = getFormMeta(slug);
      var cat = FORM_CATALOG[slug] || {};
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) continue;
      var strategies = getStrategies(slug, sheet);
      var recCol = meta.estStart + strategies.length * 2;

      for (var i = 1; i < data.length; i++) {
        if (i !== id) continue;
        var row = data[i];
        var est = [];
        for (var s = 0; s < strategies.length; s++) {
          var colEst = meta.estStart + s * 2;
          var colObs = colEst + 1;
          est.push({
            nombre: strategies[s].nombre,
            tipo: strategies[s].tipo,
            estado: String(row[colEst] || "").trim(),
            observaciones: String(row[colObs] || "").trim()
          });
        }
        var detalle = {
          municipio: String(row[0] || "").trim(),
          institucion: String(row[1] || "").trim(),
          estrategias: est
        };
        if (meta.nombreCol >= 0) detalle.nombre = String(row[meta.nombreCol] || "").trim();
        if (meta.cargoCol >= 0) detalle.cargo = String(row[meta.cargoCol] || "").trim();
        if (cat.pideRecomendaciones) detalle.recomendaciones = String(row[recCol] || "").trim();
        return jsonResponse(detalle);
      }
    } catch (e) { /* continue */ }
  }
  return errorResponse("No encontrado");
}

// ── POST — guardar formulario ─────────────────────────────
function handleSave(data) {
  var slug = data.form;
  if (!slug || !SHEET_NAMES[slug]) throw new Error("Formulario inválido");

  var sheet = getSheet(slug);
  var meta = getFormMeta(slug);
  var cat = FORM_CATALOG[slug] || {};
  var strategies = getStrategies(slug, sheet);
  var municipio = (data.municipio || "").trim();
  var institucion = (data.institucion || "").trim();

  // Calcular semáforo
  var aplica = 0, noAplica = 0;
  for (var s = 0; s < strategies.length; s++) {
    var input = findEstrategia(data.estrategias, strategies[s].nombre);
    if (input && strategies[s].tipo === "aplica") {
      if (input.estado === "Aplica") aplica++;
      if (input.estado === "No aplica") noAplica++;
    }
  }
  var semaforo = calcularSemaforo(aplica, noAplica);

  // Construir fila — base
  var row = [municipio, institucion, semaforo];

  // Campos extra (nombre, cargo) según layout
  if (meta.nombreCol >= 0) row.push((data.nombre || "").trim());
  if (meta.cargoCol >= 0) row.push((data.cargo || "").trim());

  // Estrategias (estado/valor + observaciones)
  for (s = 0; s < strategies.length; s++) {
    var match = findEstrategia(data.estrategias, strategies[s].nombre);
    if (match && strategies[s].tipo === "numero") {
      row.push(String(match.valor || ""));
    } else if (match) {
      row.push(match.estado || "");
    } else {
      row.push("");
    }
    row.push(match ? (match.observaciones || "") : "");
  }

  // Recomendaciones al final
  if (cat.pideRecomendaciones) row.push((data.recomendaciones || "").trim());

  sheet.appendRow(row);
  return jsonResponse({ success: true, id: sheet.getLastRow() - 1 });
}

function findEstrategia(lista, nombre) {
  lista = lista || [];
  for (var j = 0; j < lista.length; j++) {
    if (lista[j].nombre === nombre) return lista[j];
  }
  return null;
}

// ── Router ─────────────────────────────────────────────────
function doGet(e) {
  try {
    var action = e.parameter.action || "";
    switch (action) {
      case "getConfig":
        return handleGetConfig();
      case "getFormData":
        return handleGetFormData(e.parameter.form);
      case "getAdminSummary":
        return handleGetAdminSummary();
      case "getDetalle":
        return handleGetDetalle(Number(e.parameter.id), e.parameter.form);
      default:
        return errorResponse("Acción desconocida: " + action);
    }
  } catch (err) {
    return errorResponse(err.message);
  }
}

function doPost(e) {
  try {
    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = {};
    }
    return handleSave(data);
  } catch (err) {
    return errorResponse(err.message);
  }
}
