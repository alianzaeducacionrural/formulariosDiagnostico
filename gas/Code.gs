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
  emprendimiento:  "Emprendimiento"
};

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

// ── Obtener sheet por slug ─────────────────────────────────
function getSheet(slug) {
  var name = SHEET_NAMES[slug];
  if (!name) throw new Error("Formulario desconocido: " + slug);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error("Hoja no encontrada: " + name);
  return sheet;
}

// ── GET /?action=getConfig ─────────────────────────────────
function handleGetConfig() {
  var forms = {};
  for (var slug in SHEET_NAMES) {
    try {
      var sheet = getSheet(slug);
      forms[slug] = {
        title: FORM_CATALOG[slug].title,
        subtitle: FORM_CATALOG[slug].subtitle,
        description: FORM_CATALOG[slug].description,
        strategies: leerEstrategiasDeHoja(sheet)
      };
    } catch (e) {
      forms[slug] = {
        title: FORM_CATALOG[slug].title,
        subtitle: FORM_CATALOG[slug].subtitle,
        description: FORM_CATALOG[slug].description,
        strategies: []
      };
    }
  }

  return jsonResponse({
    forms: forms,
    municipios: MUNICIPIOS
  });
}

// ── GET /?action=getFormData&form=slug ─────────────────────
function handleGetFormData(slug) {
  var sheet = getSheet(slug);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse({ rows: [], strategies: [] });

  var strategies = leerEstrategiasDeHoja(sheet);
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var estrategias = [];
    var aplica = 0, noAplica = 0;

    for (var s = 0; s < strategies.length; s++) {
      var colEst = 3 + s * 2;
      var colObs = 4 + s * 2;
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

    rows.push({
      id: i,
      municipio: String(row[0] || "").trim(),
      institucion: String(row[1] || "").trim(),
      semaforo: semaforo,
      estrategias: estrategias
    });
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
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) continue;
      var strategies = leerEstrategiasDeHoja(sheet);

      for (var i = 1; i < data.length; i++) {
        if (i !== id) continue;
        var row = data[i];
        var est = [];
        for (var s = 0; s < strategies.length; s++) {
          var colEst = 3 + s * 2;
          var colObs = 4 + s * 2;
          est.push({
            nombre: strategies[s].nombre,
            tipo: strategies[s].tipo,
            estado: String(row[colEst] || "").trim(),
            observaciones: String(row[colObs] || "").trim()
          });
        }
        return jsonResponse({
          municipio: String(row[0] || "").trim(),
          institucion: String(row[1] || "").trim(),
          estrategias: est
        });
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
  var strategies = leerEstrategiasDeHoja(sheet);
  var municipio = (data.municipio || "").trim();
  var institucion = (data.institucion || "").trim();

  // Calcular semáforo
  var aplica = 0, noAplica = 0;
  for (var s = 0; s < strategies.length; s++) {
    var input = null;
    for (var j = 0; j < (data.estrategias || []).length; j++) {
      if (data.estrategias[j].nombre === strategies[s].nombre) {
        input = data.estrategias[j];
        break;
      }
    }
    if (input && strategies[s].tipo === "aplica") {
      if (input.estado === "Aplica") aplica++;
      if (input.estado === "No aplica") noAplica++;
    }
  }
  var semaforo = calcularSemaforo(aplica, noAplica);

  // Construir fila
  var row = [municipio, institucion, semaforo];
  for (s = 0; s < strategies.length; s++) {
    var match = null;
    for (j = 0; j < (data.estrategias || []).length; j++) {
      if (data.estrategias[j].nombre === strategies[s].nombre) {
        match = data.estrategias[j];
        break;
      }
    }
    if (match && strategies[s].tipo === "numero") {
      row.push(String(match.valor || ""));
    } else if (match) {
      row.push(match.estado || "");
    } else {
      row.push("");
    }
    row.push(match ? (match.observaciones || "") : "");
  }

  sheet.appendRow(row);
  return jsonResponse({ success: true, id: sheet.getLastRow() - 1 });
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
