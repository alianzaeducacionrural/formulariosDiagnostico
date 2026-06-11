// ── Cargar config y renderizar formulario ────────────────
var configCache = null;

async function getConfig() {
  if (configCache) return configCache;
  var res = await fetch(GAS_URL + "?action=getConfig");
  var json = await res.json();
  configCache = json.data;
  return configCache;
}

function getFormSlug() {
  var params = new URLSearchParams(window.location.search);
  return params.get("tipo") || "escuela_nueva";
}

// ── Render form ──────────────────────────────────────────
async function initForm() {
  var config = await getConfig();
  var slug = getFormSlug();
  var form = config.forms[slug];
  if (!form) { document.body.innerHTML = "<p>Formulario no encontrado</p>"; return; }

  document.getElementById("form-title").textContent = form.title;
  document.getElementById("form-description").innerHTML = form.description;
  document.getElementById("form-action").value = slug;

  // Municipios
  var selMuni = document.getElementById("municipio");
  Object.keys(config.municipios).sort().forEach(function(m) {
    var opt = document.createElement("option");
    opt.value = m; opt.textContent = m;
    selMuni.appendChild(opt);
  });

  // Estrategias
  var container = document.getElementById("estrategias-container");
  container.innerHTML = "";
  form.strategies.forEach(function(est, i) {
    var fieldset = document.createElement("fieldset");
    fieldset.className = "estrategia";

    if (est.tipo === "numero") {
      fieldset.innerHTML = `
        <legend>${est.nombre}</legend>
        <input type="number" name="estrategias[${i}][valor]" min="0" required
               data-nombre="${est.nombre}" data-tipo="numero" class="estr-input">
        <textarea name="estrategias[${i}][observaciones]" class="estr-obs"
                  placeholder="Observaciones" required
                  data-nombre="${est.nombre}" data-tipo="numero"></textarea>
      `;
    } else {
      fieldset.innerHTML = `
        <div class="estrategia-header">${est.nombre}</div>
        <div class="toggle-group">
          <input type="radio" id="aplica-${i}" name="estado-${i}" value="Aplica" required
                 data-nombre="${est.nombre}" data-tipo="aplica" class="estr-radio">
          <label for="aplica-${i}" class="toggle toggle-aplica">✔ Aplica</label>
          <input type="radio" id="noaplica-${i}" name="estado-${i}" value="No aplica"
                 data-nombre="${est.nombre}" data-tipo="aplica" class="estr-radio">
          <label for="noaplica-${i}" class="toggle toggle-noaplica">✖ No aplica</label>
        </div>
        <textarea name="estrategias[${i}][observaciones]"
                  placeholder="Observaciones (obligatorio)" required
                  data-nombre="${est.nombre}" data-tipo="aplica" class="estr-obs"></textarea>
      `;
    }
    container.appendChild(fieldset);
  });

  // Institución dinámica
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
    var slug = fd.get("form");
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
      municipio: fd.get("municipio"),
      institucion: fd.get("institucion"),
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
