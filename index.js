const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

const municipiosInstituciones = require("./data/municipiosInstituciones");

/* =====================================================
   CATÁLOGO DE FORMULARIOS (NOMBRES LEGIBLES)
===================================================== */
const catalogoFormularios = {
  "Modelo Escuela Nueva": {
    nombre: "Evaluación Modelo Escuela Nueva"
  },
  "Proyectos Pedagógicos Productivos (PPP)": {
    nombre: "Proyectos Pedagógicos Productivos (PPP)"
  },
  "Escuela Virtual": {
    nombre: "Escuela Virtual"
  },
  "Emprendimiento": {
    nombre: "Emprendimiento"
  }
};

/* =====================================================
   LISTAS DE ESTRATEGIAS
===================================================== */

// Formulario 1
const estrategiasEscuelaNueva = [
  "Operatividad del Gobierno Estudiantil",
  "Uso de guías de interaprendizaje con Escuela Nueva",
  "Realización de actividades de conjunto",
  "Manejo de instrumentos de gobierno estudiantil",
  "Ambientación de aulas",
  "Organización de los docentes en Microcentro",
  "Hora de Gestión de Negocios",
  "Trabajo en equipo"
];

// Formulario 2
const estrategiasPPP = [
  "Implementación del proyecto Escuela y Café",
  "Implementación del proyecto Escuela y Seguridad Alimentaria",
  "Uso de las guías de interaprendizaje de los PPP",
  "Implementación proyectos dirigidos",
  "Implementación proyectos supervisados, modelos y planes de negocio",
  "Uso del libro de registros",
  "Asignación de docente líder",
  "Asignación de una hora como mínimo para el desarrollo del proyecto Escuela y Café",
  "Asignación de una hora como mínimo para el desarrollo del proyecto Escuela y Seguridad Alimentaria"
];

// Formulario 3
const estrategiasEscuelaVirtual = [
  "Implementación del proyecto Escuela Virtual",
  "Asignación de docente líder",
  "Uso de guías del proyecto",
  "Implementación fase 1: Estudio y Adaptación de Guías",
  "Implementación fase 2: Proyectos Colaborativos",
  "Implementación fase 3: Consultorios Virtuales",
  "Implementación fase 4: Capacitación Virtual",
  "Implementación fase 5: Telecentros Comunitarios",
  "Uso de los kits de robótica",
  "Asignación de una hora como mínimo para el desarrollo del proyecto Escuela Virtual"
];

// Formulario 4
const estrategiasEmprendimiento = [
  { nombre: "Existencia y operatividad del Comité de Apoyo Agropecuario", tipo: "aplica" },
  { nombre: "Sostenibilidad del fondo Rotatorio", tipo: "aplica" },
  { nombre: "Existencia de libros reglamentarios", tipo: "aplica" },
  { nombre: "Dinero Existente", tipo: "numero_observacion" },
  { nombre: "Número de proyectos apoyados en el 2025", tipo: "numero_observacion" }
];

/* =====================================================
   FUNCIÓN SEMÁFORO (CORRECTA Y FILTRADA)
===================================================== */
function calcularSemaforo(estrategias) {
  let totalValidas = 0;
  let suma = 0;

  for (const nombre in estrategias) {
    const e = estrategias[nombre];
    if (
      e.tipo === "aplica" &&
      (e.estado === "Aplica" || e.estado === "No aplica")
    ) {
      totalValidas++;
      if (e.estado === "Aplica") suma++;
    }
  }

  const promedio = totalValidas > 0 ? suma / totalValidas : 0;

  let color = "red";
  let texto = "Rojo";

  if (promedio >= 0.75) {
    color = "green";
    texto = "Verde";
  } else if (promedio >= 0.5) {
    color = "orange";
    texto = "Amarillo";
  }

  return { promedio, color, texto, totalValidas };
}

/* =====================================================
   FORMULARIO 1 — MODELO ESCUELA NUEVA
===================================================== */
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Formulario Modelo Escuela Nueva</title>
        <link rel="stylesheet" href="/styles.css">
      </head>

      <body>
        <main class="container">
          <section class="card form-card">
              <h1>¿Cómo estamos? ¿Cómo vamos?</h1>
              <p><strong>Apreciado Rector(a)</strong></p>
              <p>
                Con el propósito de tomar decisiones pertinentes frente a las acciones de formación,
                asesoría y acompañamiento a desarrollar en las instituciones educativas que aplican
                el modelo educativo rural con Escuela Nueva le invitamos a diligenciar el siguiente
                formulario diagnóstico:
              </p>
              <hr />

              <form id="formEscuelaNueva" method="POST" action="/enviar-escuela-nueva">
                <label>Nombre:</label><br />
                <input type="text" name="nombre" required /><br /><br />

                <label>Municipio:</label><br />
                  <select name="municipio" id="municipio" required>
                    <option value="" selected disabled>Seleccione un municipio</option>
                    ${Object.keys(municipiosInstituciones).map(m => `
                      <option value="${m}">${m}</option>
                    `).join("")}
                </select><br /><br />

                <label>Institución Educativa:</label><br />
                  <select name="institucion" id="institucion" required>
                    <option value="">Seleccione un municipio primero</option>
                </select><br /><br />

                <h3>Estrategias</h3>

                <div class="estrategias">
                  ${estrategiasEscuelaNueva.map((e, i) => `
                    <div class="estrategia-card">
                      <h4>${e}</h4>

                      <div class="opciones">
                        <label class="opcion">
                          <input type="radio" name="estrategias[${i}][estado]" value="Aplica" required>
                          <span>Aplica</span>
                        </label>

                        <label class="opcion">
                          <input type="radio" name="estrategias[${i}][estado]" value="No aplica">
                          <span>No aplica</span>
                        </label>
                      </div>

                      <label class="obs-label">Observaciones</label>
                      <textarea name="estrategias[${i}][observaciones]" required></textarea>

                      <input type="hidden" name="estrategias[${i}][nombre]" value="${e}">
                      <input type="hidden" name="estrategias[${i}][tipo]" value="aplica">
                    </div>
                  `).join("")}
                </div>
                <br />
                <div class="form-actions">
                  <button type="button" onclick="abrirConfirmacion('formEscuelaNueva')">
                    Enviar
                  </button>
                </div>


                <script>
                  const institucionesPorMunicipio = ${JSON.stringify(municipiosInstituciones)};
                  const municipioSelect = document.getElementById("municipio");
                  const institucionSelect = document.getElementById("institucion");

                  municipioSelect.addEventListener("change", () => {
                    const municipio = municipioSelect.value;

                    // Limpiar select
                    institucionSelect.innerHTML = "";

                    // Opción placeholder (selected + disabled)
                    const placeholder = document.createElement("option");
                    placeholder.value = "";
                    placeholder.textContent = "Seleccione una institución";
                    placeholder.selected = true;
                    placeholder.disabled = true;
                    institucionSelect.appendChild(placeholder);

                    // Si no hay municipio válido, salimos
                    if (!institucionesPorMunicipio[municipio]) {
                      return;
                    }

                    // Cargar instituciones
                    institucionesPorMunicipio[municipio].forEach(inst => {
                      const option = document.createElement("option");
                      option.value = inst;
                      option.textContent = inst;
                      institucionSelect.appendChild(option);
                    });
                  });
                </script>
              </form>
            </section>
          </main>

          <!-- MODAL CONFIRMACIÓN -->
          <div id="modalConfirmacion" class="modal">
            <div class="modal-content">
              <h3>¿Confirmar envío?</h3>
              <p>
                ¿Está seguro(a) de que desea enviar el formulario?<br>
                Una vez enviado no podrá modificar la información.
              </p>

              <div class="modal-actions">
                <button class="btn-secondary" onclick="cerrarConfirmacion()">
                  Cancelar
                </button>
                <button class="btn-primary" onclick="confirmarEnvio('formEscuelaNueva')">
                  Sí, enviar
                </button>
              </div>
            </div>
          </div>

          <script>
            function abrirConfirmacion(formId) {
              const form = document.getElementById(formId);

              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }

              document.getElementById("modalConfirmacion").style.display = "flex";
            }

            function cerrarConfirmacion() {
              document.getElementById("modalConfirmacion").style.display = "none";
            }

            function confirmarEnvio(formId) {
              document.getElementById(formId).submit();
            }
          </script>
        </body>
    </html>
  `);
});

app.post("/enviar-escuela-nueva", (req, res) => {
  const estrategiasProcesadas = {};
  req.body.estrategias.forEach(e => {
    estrategiasProcesadas[e.nombre] = {
      tipo: "aplica",
      estado: e.estado,
      observaciones: e.observaciones || ""
    };
  });

  const data = JSON.parse(fs.readFileSync("respuestas.json", "utf8"));
  data.push({
    formulario: "Modelo Escuela Nueva",
    nombre: req.body.nombre,
    municipio: req.body.municipio,
    institucion: req.body.institucion,
    estrategias: estrategiasProcesadas,
    fecha: new Date().toISOString()
  });

  fs.writeFileSync("respuestas.json", JSON.stringify(data, null, 2));

  res.redirect("/gracias");
});

/* =====================================================
   FORMULARIO 2 — PROYECTOS PEDAGÓGICOS PRODUCTIVOS
===================================================== */

app.get("/formulario-ppp", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Formulario PPP</title>
        <link rel="stylesheet" href="/styles.css">
      </head>

      <body>
        <main class="container">
          <section class="card form-card">
            <h1>¿Cómo estamos? ¿Cómo vamos?</h1>
            <p><strong>Apreciado Rector(a) y/o docente líder</strong></p>
            <p>
              Con el propósito de tomar decisiones pertinentes frente a las acciones de formación,
              asesoría y acompañamiento a desarrollar en las instituciones educativas que aplican
              los Proyectos Pedagógicos Productivos, les invitamos a diligenciar el siguiente
              formulario diagnóstico:
            </p>
            <hr />

            <form id="formPPP" method="POST" action="/enviar-ppp">
              <label>Nombre:</label><br />
              <input type="text" name="nombre" required /><br /><br />

              <label>Municipio:</label><br />
                <select name="municipio" id="municipio" required>
                  <option value="" selected disabled>Seleccione un municipio</option>
                  ${Object.keys(municipiosInstituciones).map(m => `
                    <option value="${m}">${m}</option>
                  `).join("")}
              </select><br /><br />

              <label>Institución Educativa:</label><br />
                <select name="institucion" id="institucion" required>
                  <option value="">Seleccione un municipio primero</option>
              </select><br /><br />

              <h3>Estrategias</h3>

              <div class="estrategias">
                ${estrategiasPPP.map((e, i) => `
                  <div class="estrategia-card">
                    <h4>${e}</h4>

                    <div class="opciones">
                      <label class="opcion">
                        <input type="radio" name="estrategias[${i}][estado]" value="Aplica" required>
                        <span>Aplica</span>
                      </label>

                      <label class="opcion">
                        <input type="radio" name="estrategias[${i}][estado]" value="No aplica">
                        <span>No aplica</span>
                      </label>
                    </div>

                    <label class="obs-label">Observaciones</label>
                    <textarea name="estrategias[${i}][observaciones]" required></textarea>

                    <input type="hidden" name="estrategias[${i}][nombre]" value="${e}">
                    <input type="hidden" name="estrategias[${i}][tipo]" value="aplica">
                  </div>
                `).join("")}
              </div>
              <br />
              <div class="form-actions">
                <button type="button" onclick="abrirConfirmacion('formPPP')">
                  Enviar
                </button>
              </div>



              <script>
                const institucionesPorMunicipio = ${JSON.stringify(municipiosInstituciones)};
                const municipioSelect = document.getElementById("municipio");
                const institucionSelect = document.getElementById("institucion");

                municipioSelect.addEventListener("change", () => {
                  const municipio = municipioSelect.value;

                  // Limpiar select
                  institucionSelect.innerHTML = "";

                  // Opción placeholder (selected + disabled)
                  const placeholder = document.createElement("option");
                  placeholder.value = "";
                  placeholder.textContent = "Seleccione una institución";
                  placeholder.selected = true;
                  placeholder.disabled = true;
                  institucionSelect.appendChild(placeholder);

                  // Si no hay municipio válido, salimos
                  if (!institucionesPorMunicipio[municipio]) {
                    return;
                  }

                  // Cargar instituciones
                  institucionesPorMunicipio[municipio].forEach(inst => {
                    const option = document.createElement("option");
                    option.value = inst;
                    option.textContent = inst;
                    institucionSelect.appendChild(option);
                  });
                });
              </script>
            </form>
          </section>
        </main>

        <!-- MODAL CONFIRMACIÓN -->
        <div id="modalConfirmacion" class="modal">
          <div class="modal-content">
            <h3>¿Confirmar envío?</h3>
            <p>
              ¿Está seguro(a) de que desea enviar el formulario?<br>
              Una vez enviado no podrá modificar la información.
            </p>

            <div class="modal-actions">
              <button class="btn-secondary" onclick="cerrarConfirmacion()">
                Cancelar
              </button>
              <button class="btn-primary" onclick="confirmarEnvio('formPPP')">
                Sí, enviar
              </button>
            </div>
          </div>
        </div>

        <script>
          function abrirConfirmacion(formId) {
            const form = document.getElementById(formId);

            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            document.getElementById("modalConfirmacion").style.display = "flex";
          }

          function cerrarConfirmacion() {
            document.getElementById("modalConfirmacion").style.display = "none";
          }

          function confirmarEnvio(formId) {
            document.getElementById(formId).submit();
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/enviar-ppp", (req, res) => {
  const estrategiasProcesadas = {};

  req.body.estrategias.forEach(e => {
    estrategiasProcesadas[e.nombre] = {
      tipo: "aplica",
      estado: e.estado,
      observaciones: e.observaciones || ""
    };
  });

  const data = JSON.parse(fs.readFileSync("respuestas.json", "utf8"));

  data.push({
    formulario: "Proyectos Pedagógicos Productivos (PPP)",
    nombre: req.body.nombre,
    cargo: req.body.cargo,
    municipio: req.body.municipio,
    institucion: req.body.institucion,
    estrategias: estrategiasProcesadas,
    fecha: new Date().toISOString()
  });

  fs.writeFileSync("respuestas.json", JSON.stringify(data, null, 2));
  
  res.redirect("/gracias");
});


/* =====================================================
   FORMULARIO 3 — ESCUELA VIRTUAL
===================================================== */

app.get("/formulario-escuela-virtual", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Formulario Escuela Virtual</title>
        <link rel="stylesheet" href="/styles.css">
      </head>

      <body>
        <main class="container">
          <section class="card form-card">
            <h1>¿Cómo estamos? ¿Cómo vamos?</h1>
            <p><strong>Apreciado Rector(a) y/o docente líder</strong></p>
            <p>
              Con el propósito de tomar decisiones pertinentes frente a las acciones de formación,
              asesoría y acompañamiento a desarrollar en las instituciones educativas que aplican
              el proyecto Escuela Virtual, les invitamos a diligenciar el siguiente formulario diagnóstico:
            </p>
            <hr />

            <form id="formEscuelaVirtual" method="POST" action="/enviar-escuela-virtual">
              <label>Nombre:</label><br />
              <input type="text" name="nombre" required /><br /><br />

              <label>Municipio:</label><br />
                <select name="municipio" id="municipio" required>
                  <option value="" selected disabled>Seleccione un municipio</option>
                  ${Object.keys(municipiosInstituciones).map(m => `
                    <option value="${m}">${m}</option>
                  `).join("")}
              </select><br /><br />

              <label>Institución Educativa:</label><br />
                <select name="institucion" id="institucion" required>
                  <option value="">Seleccione un municipio primero</option>
              </select><br /><br />

              <h3>Estrategias</h3>

              <div class="estrategias">
                ${estrategiasEscuelaVirtual.map((e, i) => `
                  <div class="estrategia-card">
                    <h4>${e}</h4>

                    <div class="opciones">
                      <label class="opcion">
                        <input type="radio" name="estrategias[${i}][estado]" value="Aplica" required>
                        <span>Aplica</span>
                      </label>

                      <label class="opcion">
                        <input type="radio" name="estrategias[${i}][estado]" value="No aplica">
                        <span>No aplica</span>
                      </label>
                    </div>

                    <label class="obs-label">Observaciones</label>
                    <textarea name="estrategias[${i}][observaciones]" required></textarea>

                    <input type="hidden" name="estrategias[${i}][nombre]" value="${e}">
                    <input type="hidden" name="estrategias[${i}][tipo]" value="aplica">
                  </div>
                `).join("")}
              </div>
              <br />
              <div class="form-actions">
                <button type="button" onclick="abrirConfirmacion('formEscuelaVirtual')">
                  Enviar
                </button>
              </div>

              <script>
                const institucionesPorMunicipio = ${JSON.stringify(municipiosInstituciones)};
                const municipioSelect = document.getElementById("municipio");
                const institucionSelect = document.getElementById("institucion");

                municipioSelect.addEventListener("change", () => {
                  const municipio = municipioSelect.value;

                  // Limpiar select
                  institucionSelect.innerHTML = "";

                  // Opción placeholder (selected + disabled)
                  const placeholder = document.createElement("option");
                  placeholder.value = "";
                  placeholder.textContent = "Seleccione una institución";
                  placeholder.selected = true;
                  placeholder.disabled = true;
                  institucionSelect.appendChild(placeholder);

                  // Si no hay municipio válido, salimos
                  if (!institucionesPorMunicipio[municipio]) {
                    return;
                  }

                  // Cargar instituciones
                  institucionesPorMunicipio[municipio].forEach(inst => {
                    const option = document.createElement("option");
                    option.value = inst;
                    option.textContent = inst;
                    institucionSelect.appendChild(option);
                  });
                });
              </script>
            </form>
          </section>
        </main>

        <!-- MODAL CONFIRMACIÓN -->
        <div id="modalConfirmacion" class="modal">
          <div class="modal-content">
            <h3>¿Confirmar envío?</h3>
            <p>
              ¿Está seguro(a) de que desea enviar el formulario?<br>
              Una vez enviado no podrá modificar la información.
            </p>

            <div class="modal-actions">
              <button class="btn-secondary" onclick="cerrarConfirmacion()">
                Cancelar
              </button>
              <button class="btn-primary" onclick="confirmarEnvio('formEscuelaVirtual')">
                Sí, enviar
              </button>
            </div>
          </div>
        </div>

        <script>
          function abrirConfirmacion(formId) {
            const form = document.getElementById(formId);

            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            document.getElementById("modalConfirmacion").style.display = "flex";
          }

          function cerrarConfirmacion() {
            document.getElementById("modalConfirmacion").style.display = "none";
          }

          function confirmarEnvio(formId) {
            document.getElementById(formId).submit();
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/enviar-escuela-virtual", (req, res) => {
  const estrategiasProcesadas = {};

  req.body.estrategias.forEach(e => {
    estrategiasProcesadas[e.nombre] = {
      tipo: "aplica",
      estado: e.estado,
      observaciones: e.observaciones || ""
    };
  });

  const data = JSON.parse(fs.readFileSync("respuestas.json", "utf8"));

  data.push({
    formulario: "Escuela Virtual",
    nombre: req.body.nombre,
    cargo: req.body.cargo,
    municipio: req.body.municipio,
    institucion: req.body.institucion,
    estrategias: estrategiasProcesadas,
    fecha: new Date().toISOString()
  });

  fs.writeFileSync("respuestas.json", JSON.stringify(data, null, 2));

  res.redirect("/gracias");
});


/* =====================================================
   FORMULARIO 4 — EMPRENDIMIENTO
===================================================== */

app.get("/formulario-emprendimiento", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Formulario Emprendimiento</title>
        <link rel="stylesheet" href="/styles.css">
      </head>

      <body>
        <main class="container">
          <section class="card form-card">
            <h1>¿Cómo estamos? ¿Cómo vamos?</h1>
            <p><strong>Apreciado Rector(a) y/o docente líder</strong></p>
            <p>
              Con el propósito de tomar decisiones pertinentes frente a las acciones de formación,
              asesoría y acompañamiento a desarrollar en las instituciones educativas que aplican
              la línea de Emprendimiento, le invitamos a diligenciar el siguiente formulario diagnóstico:
            </p>
            <hr />

            <form id="formEmprendimiento" method="POST" action="/enviar-emprendimiento">

              <label>Nombre:</label>
              <input type="text" name="nombre" required>

              <label>Municipio:</label>
              <select name="municipio" id="municipio" required>
                <option value="" selected disabled>Seleccione un municipio</option>
                ${Object.keys(municipiosInstituciones).map(m => `
                  <option value="${m}">${m}</option>
                `).join("")}
              </select>

              <label>Institución Educativa:</label>
              <select name="institucion" id="institucion" required>
                <option value="" selected disabled>Seleccione un municipio primero</option>
              </select>

              <h3>Estrategias</h3>

              <div class="estrategias">
                ${estrategiasEmprendimiento.map((e, i) => {

                  // 🔹 Aplica / No aplica
                  if (e.tipo === "aplica") {
                    return `
                      <div class="estrategia-card">
                        <h4>${e.nombre}</h4>

                        <div class="opciones">
                          <label class="opcion">
                            <input type="radio" name="estrategias[${i}][estado]" value="Aplica" required>
                            <span>Aplica</span>
                          </label>

                          <label class="opcion">
                            <input type="radio" name="estrategias[${i}][estado]" value="No aplica">
                            <span>No aplica</span>
                          </label>
                        </div>

                        <label class="obs-label">Observaciones</label>
                        <textarea name="estrategias[${i}][observaciones]" required></textarea>

                        <input type="hidden" name="estrategias[${i}][nombre]" value="${e.nombre}">
                        <input type="hidden" name="estrategias[${i}][tipo]" value="aplica">
                      </div>
                    `;
                  }

                  // 🔹 Numérico + observaciones
                  return `
                    <div class="estrategia-card">
                      <h4>${e.nombre}</h4>

                      <label class="obs-label">Valor</label>
                      <input
                        type="number"
                        name="estrategias[${i}][valor]"
                        min="0"
                        required
                      >

                      <label class="obs-label">Observaciones</label>
                      <textarea name="estrategias[${i}][observaciones]" required></textarea>

                      <input type="hidden" name="estrategias[${i}][nombre]" value="${e.nombre}">
                      <input type="hidden" name="estrategias[${i}][tipo]" value="numero_observacion">
                    </div>
                  `;
                }).join("")}
              </div>

              <div class="form-actions">
                <button type="button" onclick="abrirConfirmacion('formEmprendimiento')">
                  Enviar
                </button>
              </div>
            </form>
          </section>
        </main>

        <!-- MODAL CONFIRMACIÓN -->
        <div id="modalConfirmacion" class="modal">
          <div class="modal-content">
            <h3>¿Confirmar envío?</h3>
            <p>
              ¿Está seguro(a) de que desea enviar el formulario?<br>
              Una vez enviado no podrá modificar la información.
            </p>

            <div class="modal-actions">
              <button class="btn-secondary" onclick="cerrarConfirmacion()">Cancelar</button>
              <button class="btn-primary" onclick="confirmarEnvio('formEmprendimiento')">
                Sí, enviar
              </button>
            </div>
          </div>
        </div>

        <!-- SCRIPT -->
        <script>
          const institucionesPorMunicipio = ${JSON.stringify(municipiosInstituciones)};
          const municipioSelect = document.getElementById("municipio");
          const institucionSelect = document.getElementById("institucion");

          municipioSelect.addEventListener("change", () => {
            institucionSelect.innerHTML = "";

            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "Seleccione una institución";
            placeholder.selected = true;
            placeholder.disabled = true;
            institucionSelect.appendChild(placeholder);

            (institucionesPorMunicipio[municipioSelect.value] || []).forEach(inst => {
              const option = document.createElement("option");
              option.value = inst;
              option.textContent = inst;
              institucionSelect.appendChild(option);
            });
          });

          function abrirConfirmacion(formId) {
            const form = document.getElementById(formId);
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }
            document.getElementById("modalConfirmacion").style.display = "flex";
          }

          function cerrarConfirmacion() {
            document.getElementById("modalConfirmacion").style.display = "none";
          }

          function confirmarEnvio(formId) {
            document.getElementById(formId).submit();
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/enviar-emprendimiento", (req, res) => {
  const estrategiasProcesadas = {};

  req.body.estrategias.forEach(e => {
    if (e.tipo === "aplica") {
      estrategiasProcesadas[e.nombre] = {
        tipo: "aplica",
        estado: e.estado,
        observaciones: e.observaciones
      };
    } else {
      estrategiasProcesadas[e.nombre] = {
        tipo: "numero_observacion",
        valor: Number(e.valor),
        observaciones: e.observaciones
      };
    }
  });

  const data = JSON.parse(fs.readFileSync("respuestas.json", "utf8"));

  data.push({
    formulario: "Emprendimiento",
    nombre: req.body.nombre,
    municipio: req.body.municipio,
    institucion: req.body.institucion,
    estrategias: estrategiasProcesadas,
    fecha: new Date().toISOString()
  });

  fs.writeFileSync("respuestas.json", JSON.stringify(data, null, 2));

  res.redirect("/gracias");
});

/* =====================================================
   PANEL ADMIN — SEPARADO POR FORMULARIO
===================================================== */
app.get("/admin", (req, res) => {
  let lista = "";

  for (const f in catalogoFormularios) {
    lista += `
      <li>
        <a href="/admin/formulario/${encodeURIComponent(f)}">
          ${catalogoFormularios[f].nombre}
        </a>
      </li>
    `;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Panel</title>
        <link rel="stylesheet" href="/styles.css">
      </head>

      <body>
        <h1>Panel Administrador</h1>
        <p>Seleccione el formulario que desea consultar:</p>
        <ul>
          ${lista}
        </ul>
      </body>
    </html>
  `);
});


app.get("/admin/formulario/:nombre", (req, res) => {
  const formulario = decodeURIComponent(req.params.nombre);

  if (!catalogoFormularios[formulario]) {
    return res.send("<h2>Formulario no encontrado</h2>");
  }

  const data = JSON.parse(fs.readFileSync("respuestas.json", "utf8"));
  let respuestas = data.filter(r => r.formulario === formulario);

  // 🔹 Filtros
  const filtroMunicipio = req.query.municipio || "";
  const filtroInstitucion = req.query.institucion || "";
  const filtroSemaforo = req.query.semaforo || "";

  if (filtroMunicipio) {
    respuestas = respuestas.filter(r => r.municipio === filtroMunicipio);
  }

  if (filtroInstitucion) {
    respuestas = respuestas.filter(r => r.institucion === filtroInstitucion);
  }

  if (filtroSemaforo) {
    respuestas = respuestas.filter(r => {
      const s = calcularSemaforo(r.estrategias);
      return s.texto === filtroSemaforo;
    });
  }

  // 🔹 Valores únicos
  const municipios = Object.keys(municipiosInstituciones);
  const instituciones = filtroMunicipio
  ? municipiosInstituciones[filtroMunicipio] || []
  : [];

  let filas = "";

  respuestas.forEach((r, i) => {
    const s = calcularSemaforo(r.estrategias);

    let detalleHTML = `
      <table style="margin-top:10px;">
        <tr>
          <th>Estrategia</th>
          <th>Resultado</th>
          <th>Observaciones</th>
        </tr>
    `;

    for (const nombre in r.estrategias) {
      const e = r.estrategias[nombre];

      let resultado = "-";
      if (e.estado) resultado = e.estado;
      if (e.valor !== undefined) resultado = e.valor;

      detalleHTML += `
        <tr>
          <td>${nombre}</td>
          <td>${resultado}</td>
          <td>${e.observaciones || ""}</td>
        </tr>
      `;
    }

    detalleHTML += "</table>";


    filas += `
      <tr>
        <td>${i + 1}</td>
        <td>${r.nombre}</td>
        <td>${r.municipio}</td>
        <td>${r.institucion}</td>
        <td>
          <span class="semaforo ${
            s.texto === "Verde" ? "verde" :
            s.texto === "Amarillo" ? "amarillo" : "rojo"
          }">
            ${s.texto}
          </span>
          <div style="font-size:12px;margin-top:4px;">
            ${(s.promedio * 100).toFixed(0)}%
          </div>
        </td>
        <td>
          <details>
            <summary style="cursor:pointer;">Ver detalle</summary>
            ${detalleHTML}
          </details>
        </td>

      </tr>
    `;
  });

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>admin</title>
        <link rel="stylesheet" href="/styles.css">
      </head>

      <body>
        <div class="card">
          <h2>${catalogoFormularios[formulario].nombre}</h2>

          <!-- ✅ FORMULARIO DE FILTROS -->

          <form method="GET" style="margin-bottom:20px;">
            <div class="card filtros">
              <label>Municipio:</label>
              <select name="municipio" onchange="this.form.submit()">
                <option value="" selected disabled>Seleccione un municipio</option>
                ${municipios.map(m => `
                  <option value="${m}" ${m === filtroMunicipio ? "selected" : ""}>
                    ${m}
                  </option>
                `).join("")}
              </select>


              <label>Institución:</label>
              <select name="institucion">
                <option value="" selected disabled>
                  ${filtroMunicipio ? "Seleccione la institución Educativa" : "Seleccione un municipio primero"}
                </option>
                ${instituciones.map(i => `
                  <option value="${i}" ${i === filtroInstitucion ? "selected" : ""}>
                    ${i}
                  </option>
                `).join("")}
              </select>

              <label>Semáforo:</label>
              <select name="semaforo">
                <option value="">Todos</option>
                <option value="Verde" ${filtroSemaforo === "Verde" ? "selected" : ""}>Verde</option>
                <option value="Amarillo" ${filtroSemaforo === "Amarillo" ? "selected" : ""}>Amarillo</option>
                <option value="Rojo" ${filtroSemaforo === "Rojo" ? "selected" : ""}>Rojo</option>
              </select>

              <button type="submit">Filtrar</button>

              <!-- ✅ BOTÓN BORRAR FILTROS -->
              <a class="link-btn" href="/admin/formulario/${encodeURIComponent(formulario)}">
                Borrar filtros
              </a>
            </div>
          </form>

          <div class="card">
            <table border="1" cellpadding="6">
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Municipio</th>
                <th>Institución</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
              ${filas}
            </table>
          </div>

          <br />
          <a href="/admin">⬅ Volver al panel</a>
        </div>
      </body>
    </html>
  `);
});


/* =====================================================
    PAGINA DE GRACIAS
===================================================== */

app.get("/gracias", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Formulario enviado</title>
        <link rel="stylesheet" href="/styles.css">
      </head>

      <body>
        <div class="container">
          <div class="card success-card">
            <div class="icon-success">✔</div>

            <h1>Formulario enviado correctamente</h1>

            <p>
              Gracias por diligenciar el formulario.<br>
              La información fue registrada exitosamente.
            </p>
          </div>
        </div>
      </body>
    </html>
  `);
});

/* =====================================================
   SERVER
===================================================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});

