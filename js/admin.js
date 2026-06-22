// ── Admin JavaScript ─────────────────────────────────────
var configCache = null;
var currentFormSlug = null;

async function getConfig() {
  if (configCache) return configCache;
  var res = await fetch(GAS_URL + "?action=getConfig");
  var json = await res.json();
  configCache = json.data;
  if (typeof aplicarFormDefsLocales === "function") {
    configCache = aplicarFormDefsLocales(configCache);
  }
  return configCache;
}

function mostrarLoaderPagina(visible) {
  var el = document.getElementById("pageLoader");
  if (el) el.style.display = visible ? "flex" : "none";
}

// Puntaje por estado (estrategias tipo "aplica"):
//   Aplica adecuadamente             -> 1.0
//   Aplica con oportunidad de mejora -> 0.5
//   Aplica (binario)                 -> 1.0
//   No aplica                        -> 0.0
//   (sin responder / otro)           -> null (no cuenta)
function puntosEstado(estado) {
  switch (String(estado || "").trim()) {
    case "Aplica adecuadamente": return 1;
    case "Aplica con oportunidad de mejora": return 0.5;
    case "Aplica": return 1;
    case "No aplica": return 0;
    default: return null;
  }
}

function nivelDesdePct(pct) {
  return pct < 50 ? "rojo" : pct < 75 ? "amarillo" : "verde";
}

// ── Página principal /admin ───────────────────────────────
async function initAdmin() {
  mostrarLoaderPagina(true);
  try {
    var config = await getConfig();
    var res = await fetch(GAS_URL + "?action=getAdminSummary");
    var json = await res.json();
    var summary = json.data;
    var grid = document.getElementById("admin-grid");
    if (!grid) return;
    grid.innerHTML = "";

    for (var slug in summary) {
      var item = summary[slug];
      var form = config.forms[slug];
      var card = document.createElement("a");
      card.className = "admin-card";
      card.href = "admin-formulario.html?form=" + slug;
      card.innerHTML = `
        <h3 class="admin-card-title">${form ? (form.subtitle || form.title) : slug}</h3>
        <div class="admin-metrics">
          <div class="metric">
            <strong>${item.total}</strong>
            <small>Respuestas registradas</small>
          </div>
        </div>
      `;
      grid.appendChild(card);
    }
  } finally {
    mostrarLoaderPagina(false);
  }
}

// ── Página por formulario /admin?form=slug ────────────────
async function initFormAdmin() {
  var params = new URLSearchParams(window.location.search);
  var slug = params.get("form");
  if (!slug) { document.body.innerHTML = "<p>Formulario no especificado</p>"; return; }
  currentFormSlug = slug;

  mostrarLoaderPagina(true);
  try {
    var config = await getConfig();
    var formInfo = config.forms[slug];
    if (!formInfo) { document.body.innerHTML = "<p>Formulario no encontrado</p>"; return; }

    // Pedir datos
    var res = await fetch(GAS_URL + "?action=getFormData&form=" + slug);
    var json = await res.json();
    var data = json.data || {};
    var rows = data.rows || [];
    var strategies = data.strategies || [];

    var titulo = formInfo.subtitle || formInfo.title;
    document.getElementById("page-title").textContent = titulo;
    document.getElementById("admin-title").textContent = titulo;
    document.getElementById("export-link").href = "#"; // GAS no exporta xlsx directamente

    // Calcular KPIs
    var total = rows.length;
    var verdes = rows.filter(function(r) { return r.semaforo === "Verde"; }).length;
    var amarillos = rows.filter(function(r) { return r.semaforo === "Amarillo"; }).length;
    var rojos = rows.filter(function(r) { return r.semaforo === "Rojo"; }).length;
    function pct(n) { return total ? Math.round(n / total * 100) : 0; }

    document.getElementById("kpi-total").textContent = total;
    document.getElementById("kpi-verde").textContent = pct(verdes) + "%";
    document.getElementById("kpi-verde-meta").textContent = verdes + " instituciones";
    document.getElementById("kpi-amarillo").textContent = pct(amarillos) + "%";
    document.getElementById("kpi-amarillo-meta").textContent = amarillos + " instituciones";
    document.getElementById("kpi-rojo").textContent = pct(rojos) + "%";
    document.getElementById("kpi-rojo-meta").textContent = rojos + " instituciones";

    // Insights
    renderInsights(total, verdes, amarillos, rojos, rows);

    // Ranking
    renderRanking(rows, strategies);

    // Resumen por estrategia
    renderStrategySummary(rows, strategies);

    // Resumen por municipio
    renderMunicipios(rows);

    // Tabla detalle
    renderDetailTable(rows);
  } finally {
    mostrarLoaderPagina(false);
  }
}

function renderInsights(total, verdes, amarillos, rojos, rows) {
  var container = document.getElementById("insights-container");
  if (!container) return;
  var insights = [];
  if (!total) {
    insights.push({ tipo: "info", texto: "Aún no hay información suficiente para generar análisis." });
  } else {
    if (verdes > amarillos && verdes > rojos)
      insights.push({ tipo: "success", texto: "El panorama general es positivo: la mayoría de las instituciones presentan un estado favorable." });
    if (rojos / total >= 0.3)
      insights.push({ tipo: "danger", texto: "Se identifica una proporción significativa de instituciones en estado crítico (rojo)." });
    if (amarillos / total >= 0.3)
      insights.push({ tipo: "warning", texto: "Existe una oportunidad clara de mejora en instituciones con estado amarillo." });
    if (verdes / total >= 0.6)
      insights.push({ tipo: "success", texto: "Más del 60% de las instituciones evaluadas se encuentran en estado verde." });

    var municipiosCriticos = {};
    rows.forEach(function(r) {
      if (!municipiosCriticos[r.municipio]) municipiosCriticos[r.municipio] = { Verde: 0, Amarillo: 0, Rojo: 0 };
      municipiosCriticos[r.municipio][r.semaforo]++;
    });
    var criticos = Object.keys(municipiosCriticos).filter(function(m) {
      var v = municipiosCriticos[m];
      return v.Rojo >= Math.max(v.Verde, v.Amarillo);
    });
    if (criticos.length)
      insights.push({ tipo: "danger", texto: "Municipios con mayor concentración de alertas rojas: " + criticos.join(", ") + "." });
  }
  container.innerHTML = insights.map(function(i) {
    return '<div class="insight ' + i.tipo + '">' + i.texto + '</div>';
  }).join("");
}

function renderRanking(rows) {
  var tbody = document.getElementById("ranking-body");
  if (!tbody) return;

  var ranking = rows.map(function(r) {
    var puntos = 0, cuenta = 0;
    (r.estrategias || []).forEach(function(e) {
      if (e.tipo !== "aplica") return;
      var p = puntosEstado(e.estado);
      if (p !== null) { puntos += p; cuenta++; }
    });
    var pct = cuenta ? Math.round(puntos / cuenta * 100) : 0;
    return { institucion: r.institucion, municipio: r.municipio, porcentaje: pct, nivel: nivelDesdePct(pct) };
  }).sort(function(a, b) { return a.porcentaje - b.porcentaje; });

  tbody.innerHTML = ranking.slice(0, 10).map(function(r, i) {
    return '<tr><td><strong>' + (i + 1) + '</strong></td><td>' + r.institucion + '</td><td>' + r.municipio + '</td><td>' + r.porcentaje + '%</td><td><span class="semaforo ' + r.nivel + '">' + r.nivel.toUpperCase() + '</span></td></tr>';
  }).join("");
}

function renderStrategySummary(rows, strategies) {
  var container = document.getElementById("estrategias-summary");
  if (!container) return;

  var resumen = strategies.map(function(s) {
    var puntos = 0, cuenta = 0;
    rows.forEach(function(r) {
      (r.estrategias || []).forEach(function(e) {
        if (e.nombre === s.nombre && e.tipo === "aplica") {
          var p = puntosEstado(e.estado);
          if (p !== null) { puntos += p; cuenta++; }
        }
      });
    });
    var pct = cuenta ? Math.round(puntos / cuenta * 100) : 0;
    var estado = nivelDesdePct(pct);
    return { nombre: s.nombre, porcentaje: pct, estado: estado };
  });

  container.innerHTML = resumen.map(function(e) {
    return '<div class="estrategia-row"><div class="estrategia-info"><span class="estrategia-nombre">' + e.nombre + '</span><span class="estrategia-porcentaje">' + e.porcentaje + '%</span></div><div class="barra-contenedor"><div class="barra ' + e.estado + '" style="width:' + e.porcentaje + '%"></div></div></div>';
  }).join("");
}

function renderMunicipios(rows) {
  var container = document.getElementById("municipios-summary");
  if (!container) return;

  var map = {};
  rows.forEach(function(r) {
    if (!map[r.municipio]) map[r.municipio] = { Verde: 0, Amarillo: 0, Rojo: 0 };
    map[r.municipio][r.semaforo]++;
  });

  var items = Object.keys(map).map(function(m) {
    var d = map[m];
    var totalM = d.Verde + d.Amarillo + d.Rojo || 1;
    var promedio = (d.Verde * 100 + d.Amarillo * 60 + d.Rojo * 20) / totalM;
    return { municipio: m, Verde: d.Verde, Amarillo: d.Amarillo, Rojo: d.Rojo, total: totalM, promedio: promedio };
  }).sort(function(a, b) { return a.promedio - b.promedio; });

  container.innerHTML = items.map(function(m) {
    var v = Math.round(m.Verde / m.total * 100);
    var a = Math.round(m.Amarillo / m.total * 100);
    var r = Math.round(m.Rojo / m.total * 100);
    return '<div class="municipio-row"><strong>' + m.municipio + '</strong><small>' + m.total + ' instituciones</small><div class="barra-municipio"><span class="verde" style="width:' + v + '%"></span><span class="amarillo" style="width:' + a + '%"></span><span class="rojo" style="width:' + r + '%"></span></div></div>';
  }).join("");
}

function renderDetailTable(rows) {
  var tbody = document.getElementById("detalle-body");
  if (!tbody) return;

  var filtradas = rows.sort(function(a, b) {
    var m = (a.municipio || "").localeCompare(b.municipio || "");
    if (m !== 0) return m;
    return (a.institucion || "").localeCompare(b.institucion || "");
  });

  tbody.innerHTML = filtradas.map(function(r) {
    return '<tr><td>' + r.municipio + '</td><td>' + r.institucion + '</td><td><span class="semaforo ' + r.semaforo.toLowerCase() + '">' + r.semaforo + '</span></td><td><button class="btn-secondary btn-sm" onclick="verDetalle(' + r.id + ')">Ver detalle</button></td></tr>';
  }).join("");
}

// ── Detalle modal ─────────────────────────────────────────
async function verDetalle(id) {
  var modal = document.getElementById("detalle-modal");
  var contenido = document.getElementById("detalle-contenido");
  document.body.style.overflow = "hidden";
  modal.style.display = "flex";
  contenido.innerHTML = "<p>Cargando información…</p>";

  try {
    var res = await fetch(GAS_URL + "?action=getDetalle&id=" + id + "&form=" + currentFormSlug);
    var json = await res.json();
    if (!json.ok || !json.data) { contenido.innerHTML = "<p>Error cargando detalle.</p>"; return; }
    var d = json.data;

    var headerItems = '<div><strong>Municipio:</strong> ' + (d.municipio || "-") + '</div>' +
                      '<div><strong>Institución:</strong> ' + (d.institucion || "-") + '</div>';
    if (d.nombre) headerItems += '<div><strong>Nombre:</strong> ' + d.nombre + '</div>';
    if (d.cargo) headerItems += '<div><strong>Cargo:</strong> ' + d.cargo + '</div>';

    var html = '<div class="detalle-header">' + headerItems + '</div><div class="detalle-estrategias">';
    (d.estrategias || []).forEach(function(e) {
      var p = puntosEstado(e.estado);
      var cls = p === null ? "" : (p >= 1 ? "verde" : (p > 0 ? "amarillo" : "rojo"));
      html += '<div class="detalle-card"><div class="detalle-card-header"><span class="detalle-estrategia">' + e.nombre + '</span><span class="detalle-estado ' + cls + '">' + (e.estado || e.valor || "-") + '</span></div><div class="detalle-observacion">' + (e.observaciones || "Sin observaciones") + '</div></div>';
    });
    html += '</div>';

    if (d.recomendaciones) {
      html += '<div class="detalle-recomendaciones"><strong>Recomendaciones para la alianza</strong><p>' + d.recomendaciones + '</p></div>';
    }
    contenido.innerHTML = html;
  } catch (err) {
    contenido.innerHTML = "<p>Error cargando el detalle.</p>";
  }
}

function cerrarDetalle() {
  document.getElementById("detalle-modal").style.display = "none";
  document.body.style.overflow = "";
}
