// ── Cargar config y renderizar formulario ────────────────
var configCache = null;

async function getConfig() {
  if (configCache) return configCache;
  var res = await fetch(GAS_URL + "?action=getConfig");
  var json = await res.json();
  configCache = json.data;
  // Mezcla definiciones locales de respaldo (config.js)
  if (typeof aplicarFormDefsLocales === "function") {
    configCache = aplicarFormDefsLocales(configCache);
  }
  return configCache;
}

function getFormSlug() {
  var params = new URLSearchParams(window.location.search);
  return params.get("tipo") || "escuela_nueva";
}

function mostrarLoaderPagina(visible) {
  var el = document.getElementById("pageLoader");
  if (el) el.style.display = visible ? "flex" : "none";
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ── Render form ──────────────────────────────────────────
async function initForm() {
  mostrarLoaderPagina(true);
  try {
    var config = await getConfig();
    var slug = getFormSlug();
    var form = config.forms[slug];
    if (!form) { document.body.innerHTML = "<p>Formulario no encontrado</p>"; return; }

    document.getElementById("form-title").textContent = form.title;
    document.getElementById("form-description").innerHTML = form.description;
    document.getElementById("form-action").value = slug;

    // Cargo (opcional)
    renderCargo(form);

    // Ubicación: texto libre o selects de municipio/institución
    renderUbicacion(form, config);

    // Estrategias
    renderEstrategias(form);

    // Recomendaciones (opcional)
    renderRecomendaciones(form);
  } finally {
    mostrarLoaderPagina(false);
  }
}

function renderCargo(form) {
  var cont = document.getElementById("cargo-container");
  if (!form.pideCargo) { cont.innerHTML = ""; return; }
  cont.innerHTML = `
    <label>Cargo</label>
    <select name="cargo" id="cargo" required>
      <option value="" disabled selected>Seleccione su cargo</option>
      <option value="Directivo">Directivo</option>
      <option value="Docente">Docente</option>
    </select>
  `;
}

function renderUbicacion(form, config) {
  var cont = document.getElementById("ubicacion-container");

  if (form.libreUbicacion) {
    cont.innerHTML = `
      <label>Municipio</label>
      <input type="text" name="municipio" id="municipio" placeholder="Escriba el municipio" required>
      <label>Institución educativa</label>
      <input type="text" name="institucion" id="institucion" placeholder="Escriba la institución educativa" required>
    `;
    return;
  }

  cont.innerHTML = `
    <label>Municipio</label>
    <select name="municipio" id="municipio" required>
      <option value="" disabled selected>Seleccione municipio</option>
    </select>
    <label>Institución</label>
    <select name="institucion" id="institucion" required>
      <option value="" disabled selected>Seleccione municipio primero</option>
    </select>
  `;

  var selMuni = document.getElementById("municipio");
  Object.keys(config.municipios || {}).sort().forEach(function(m) {
    var opt = document.createElement("option");
    opt.value = m; opt.textContent = m;
    selMuni.appendChild(opt);
  });

  selMuni.addEventListener("change", function() {
    var selInst = document.getElementById("institucion");
    selInst.innerHTML = "<option value='' disabled selected>Seleccione institución</option>";
    (config.municipios[selMuni.value] || []).forEach(function(inst) {
      var opt = document.createElement("option");
      opt.value = inst; opt.textContent = inst;
      selInst.appendChild(opt);
    });
  });
}

// Color e ícono del botón según la opción (verde / amarillo / rojo)
function estiloOpcion(valor) {
  var v = String(valor || "").toLowerCase();
  if (v.indexOf("no aplica") !== -1) return { clase: "toggle-rojo", icono: "✖" };
  if (v.indexOf("oportunidad") !== -1 || v.indexOf("mejora") !== -1) return { clase: "toggle-amarillo", icono: "◑" };
  if (v.indexOf("aplica") !== -1) return { clase: "toggle-verde", icono: "✔" };
  return { clase: "toggle-verde", icono: "" };
}

function renderEstrategias(form) {
  var container = document.getElementById("estrategias-container");
  container.innerHTML = "";
  var opciones = (form.aplicaOpciones && form.aplicaOpciones.length) ? form.aplicaOpciones : ["Aplica", "No aplica"];

  (form.strategies || []).forEach(function(est, i) {
    var fieldset = document.createElement("fieldset");
    fieldset.className = "estrategia";

    if (est.tipo === "numero") {
      fieldset.innerHTML = `
        <legend>${escapeHtml(est.nombre)}</legend>
        <input type="number" name="estrategias[${i}][valor]" min="0" required
               data-nombre="${escapeHtml(est.nombre)}" data-tipo="numero" class="estr-input">
        <textarea name="estrategias[${i}][observaciones]" class="estr-obs"
                  placeholder="Observaciones" required
                  data-nombre="${escapeHtml(est.nombre)}" data-tipo="numero"></textarea>
      `;
      container.appendChild(fieldset);
      return;
    }

    var grupoClase = opciones.length > 2 ? "toggle-group toggle-group-vertical" : "toggle-group";
    var botones = opciones.map(function(op, j) {
      var est_ = estiloOpcion(op);
      var inputId = "op-" + i + "-" + j;
      return `
        <input type="radio" id="${inputId}" name="estado-${i}" value="${escapeHtml(op)}"${j === 0 ? " required" : ""}
               data-nombre="${escapeHtml(est.nombre)}" data-tipo="aplica" class="estr-radio">
        <label for="${inputId}" class="toggle ${est_.clase}">${est_.icono} ${escapeHtml(op)}</label>
      `;
    }).join("");

    fieldset.innerHTML = `
      <div class="estrategia-header">${escapeHtml(est.nombre)}</div>
      <div class="${grupoClase}">${botones}</div>
      <textarea name="estrategias[${i}][observaciones]"
                placeholder="Observaciones (obligatorio)" required
                data-nombre="${escapeHtml(est.nombre)}" data-tipo="aplica" class="estr-obs"></textarea>
    `;
    container.appendChild(fieldset);
  });
}

function renderRecomendaciones(form) {
  var cont = document.getElementById("recomendaciones-container");
  if (!form.pideRecomendaciones) { cont.innerHTML = ""; return; }
  var label = form.recomendacionesLabel || "Recomendaciones";
  cont.innerHTML = `
    <h3>Recomendaciones</h3>
    <label>${escapeHtml(label)}</label>
    <textarea name="recomendaciones" id="recomendaciones"
              placeholder="Escriba sus recomendaciones" required></textarea>
  `;
}

// ── Confirmación y envío ────────────────────────────────
function abrirModal() {
  var form = document.getElementById("formPrincipal");
  if (!form.checkValidity()) { form.reportValidity(); return; }

  document.getElementById("resumenMunicipio").textContent =
    document.getElementById("municipio").value;
  document.getElementById("resumenInstitucion").textContent =
    document.getElementById("institucion").value;
  document.getElementById("modalConfirmacion").style.display = "flex";
}

function cerrarModal() {
  var modal = document.getElementById("modalConfirmacion");
  modal.classList.add("fade-out");
  setTimeout(function() {
    modal.style.display = "none";
    modal.classList.remove("fade-out");
  }, 200);
}

async function confirmarEnvio() {
  document.getElementById("modalConfirmacion").style.display = "none";
  document.getElementById("loadingOverlay").style.display = "flex";

  try {
    var form = document.getElementById("formPrincipal");
    var fd = new FormData(form);
    var slug = fd.get("form") || document.getElementById("form-action").value;
    var estrategias = [];
    var seen = {};

    fd.forEach(function(val, key) {
      // estado radio buttons
      var m = key.match(/^estado-(\d+)$/);
      if (m) {
        var radio = form.querySelector('input[name="' + key + '"]:checked');
        if (radio) {
          var nombre = radio.dataset.nombre;
          if (!seen[nombre]) {
            seen[nombre] = { nombre: nombre, tipo: radio.dataset.tipo, estado: null, valor: null, observaciones: "" };
            estrategias.push(seen[nombre]);
          }
          seen[nombre].estado = val;
        }
        return;
      }
    });

    // number inputs
    form.querySelectorAll(".estr-input").forEach(function(el) {
      var nombre = el.dataset.nombre;
      if (!seen[nombre]) {
        seen[nombre] = { nombre: nombre, tipo: "numero", estado: null, valor: null, observaciones: "" };
        estrategias.push(seen[nombre]);
      }
      seen[nombre].valor = el.value;
    });

    // observaciones
    form.querySelectorAll(".estr-obs").forEach(function(el) {
      var nombre = el.dataset.nombre;
      if (nombre && seen[nombre]) {
        seen[nombre].observaciones = el.value;
      }
    });

    var payload = {
      form: slug,
      nombre: fd.get("nombre"),
      cargo: fd.get("cargo") || "",
      municipio: fd.get("municipio"),
      institucion: fd.get("institucion"),
      recomendaciones: fd.get("recomendaciones") || "",
      estrategias: estrategias
    };

    var res = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    var json = await res.json();
    if (json.ok) {
      window.location.href = "gracias.html";
    } else {
      alert("Error al enviar: " + json.error);
      document.getElementById("loadingOverlay").style.display = "none";
    }
  } catch (e) {
    alert("Error de conexión. Verifica que el GAS esté desplegado.");
    document.getElementById("loadingOverlay").style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", initForm);
