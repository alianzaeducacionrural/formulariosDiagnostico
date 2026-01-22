require("dotenv").config();

const express = require("express");
const ExcelJS = require("exceljs");
const app = express();

const pool = require("./db");
const municipiosInstituciones = require("./data/municipiosInstituciones");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

/* =====================================================
   TEST CONEXIÓN BD
===================================================== */
pool.query("SELECT NOW()")
  .then(r => console.log("✅ PostgreSQL conectado:", r.rows[0].now))
  .catch(err => console.error("❌ Error DB:", err));

/* =====================================================
   CATÁLOGO DE FORMULARIOS
===================================================== */
const catalogoFormularios = {
  "Modelo Escuela Nueva": "Modelo Escuela Nueva",
  "Proyectos Pedagógicos Productivos (PPP)": "PPP",
  "Escuela Virtual": "Escuela Virtual",
  "Emprendimiento": "Emprendimiento"
};

/* =====================================================
   ESTRATEGIAS
===================================================== */
const estrategiasEscuelaNueva = [
  "Operatividad del Gobierno Estudiantil",
  "Uso de guías de interaprendizaje",
  "Actividades de conjunto",
  "Instrumentos de gobierno estudiantil",
  "Ambientación de aulas",
  "Docentes en Microcentro",
  "Hora de Gestión de Negocios",
  "Trabajo en equipo"
];

const estrategiasPPP = [
  "Implementación del proyecto Escuela y Café",
  "Implementación del proyecto Escuela y Seguridad Alimentaria",
  "Uso de las guías de interaprendizaje de los PPP",
  "Implementación proyectos dirigidos",
  "Implementación proyectos supervisados, modelos y planes de negocio",
  "Uso del libro de registros",
  "Asignación de docente líder de PPP",
  "Asignación de una hora como mínimo para el desarrollo del proyecto Escuela y Café",
  "Asignación de una hora como mínimo para el desarrollo del proyecto Escuela y Seguridad Alimentaria"
];

const estrategiasEscuelaVirtual = [
  "Implementación del proyecto Escuela Virtual",
  "Asignación de docente líder de Escuela Virtual",
  "Uso de guías del proyecto",
  "Implementación fase 1: Estudio y Adaptación de Guías",
  "Implementación fase 2: Proyectos Colaborativos",
  "Implementación fase 3: Consultorios Virtuales",
  "Implementación fase 4: Capacitación Virtual",
  "Implementación fase 5: Telecentros Comunitarios",
  "Uso de los kits de robótica",
  "Asignación de una hora como mínimo para el desarrollo del proyecto Escuela Virtual"
];

const estrategiasEmprendimiento = [
  { nombre: "Existencia y operatividad del Comité de Apoyo Agropecuario", tipo: "aplica" },
  { nombre: "Sostenibilidad del fondo Rotatorio", tipo: "aplica" },
  { nombre: "Existencia de libros reglamentarios", tipo: "aplica" },
  { nombre: "Dinero existente", tipo: "numero" },
  { nombre: "Número de proyectos apoyados en el 2025", tipo: "numero" }
];

/* =====================================================
   SEMÁFORO
===================================================== */
function calcularSemaforoPorcentaje(aplica, noAplica) {
  const total = aplica + noAplica || 1;
  const porcentaje = (aplica / total) * 100;

  if (porcentaje < 50) return "Rojo";
  if (porcentaje < 75) return "Amarillo";
  return "Verde";
}

/* =====================================================
   FORMULARIOS (GENÉRICO)
===================================================== */
function renderFormulario(res, titulo, descripcionHTML, estrategias, action) {
  res.send(`
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>${titulo}</title>
    <link rel="stylesheet" href="/styles-formularios.css">
    <script>
      fetch("/health").catch(() => {});
    </script>
  </head>
  <body>

  <main class="container">
    <section class="card form-card">
      <h1>${titulo}</h1>

      <div class="form-description">
        ${descripcionHTML}
      </div>

      <form id="formPrincipal" method="POST" action="${action}">
        
        <label>Nombre</label>
        <input type="text" name="nombre" required>

        <label>Municipio</label>
        <select name="municipio" id="municipio" required>
          <option value="" disabled selected>Seleccione municipio</option>
          ${Object.keys(municipiosInstituciones).map(m => `<option value="${m}">${m}</option>`).join("")}
        </select>

        <label>Institución</label>
        <select name="institucion" id="institucion" required>
          <option value="" disabled selected>Seleccione municipio primero</option>
        </select>

        <h3>Estrategias</h3>

        <div class="estrategias">
          ${estrategias.map((e, i) => {
            const nombre = e.nombre || e;
            const tipo = e.tipo || "aplica";

            if (tipo === "aplica") {
              return `
                <fieldset class="estrategia">
                  <div class="estrategia-header">
                    ${nombre}
                  </div>

                  <div class="toggle-group">
                    <input
                      type="radio"
                      id="aplica-${i}"
                      name="estrategias[${i}][estado]"
                      value="Aplica"
                      required
                    >
                    <label for="aplica-${i}" class="toggle toggle-aplica">
                      ✔ Aplica
                    </label>

                    <input
                      type="radio"
                      id="noaplica-${i}"
                      name="estrategias[${i}][estado]"
                      value="No aplica"
                    >
                    <label for="noaplica-${i}" class="toggle toggle-noaplica">
                      ✖ No aplica
                    </label>
                  </div>

                  <textarea
                    name="estrategias[${i}][observaciones]"
                    placeholder="Observaciones (obligatorio)"
                    required
                  ></textarea>

                  <input type="hidden" name="estrategias[${i}][nombre]" value="${nombre}">
                  <input type="hidden" name="estrategias[${i}][tipo]" value="aplica">
                </fieldset>
              `;
            }

            return `
              <fieldset class="estrategia">
                <legend>${nombre}</legend>

                <input
                  type="number"
                  name="estrategias[${i}][valor]"
                  min="0"
                  required
                >

                <textarea
                  name="estrategias[${i}][observaciones]"
                  class="obs"
                  placeholder="Observaciones"
                  required
                ></textarea>

                <input type="hidden" name="estrategias[${i}][nombre]" value="${nombre}">
                <input type="hidden" name="estrategias[${i}][tipo]" value="${tipo}">
              </fieldset>
            `;
          }).join("")}
        </div>

        <div class="form-actions">
          <button type="button" onclick="abrirModal()">Enviar</button>
        </div>

      </form>
    </section>
  </main>

  <!-- 🔥 MODAL CONFIRMACIÓN -->
  <div id="modalConfirmacion" class="modal">
    <div class="modal-box">
      <h3>Confirmar envío</h3>

      <div class="resumen">
        <div class="resumen-item">
          <span class="label">Municipio</span>
          <span id="resumenMunicipio" class="valor"></span>
        </div>

        <div class="resumen-item">
          <span class="label">Institución Educativa</span>
          <span id="resumenInstitucion" class="valor"></span>
        </div>
      </div>

      <p class="nota">
        Una vez enviada la información no podrá ser modificada.
      </p>

      <div class="modal-actions">
        <button class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
        <button class="btn-primary" onclick="confirmarEnvio()">Sí, enviar</button>
      </div>
    </div>
  </div>

  <script>
    const data = ${JSON.stringify(municipiosInstituciones)};
    const municipio = document.getElementById("municipio");
    const institucion = document.getElementById("institucion");
    const form = document.getElementById("formPrincipal");

    municipio.addEventListener("change", () => {
      institucion.innerHTML = "<option disabled selected>Seleccione institución</option>";
      (data[municipio.value] || []).forEach(inst => {
        const option = document.createElement("option");
        option.value = inst;
        option.textContent = inst;
        institucion.appendChild(option);
      });
    });

    function abrirModal() {
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      document.getElementById("resumenMunicipio").textContent =
        municipio.options[municipio.selectedIndex].text;

      document.getElementById("resumenInstitucion").textContent =
        institucion.options[institucion.selectedIndex].text;

      document.getElementById("modalConfirmacion").style.display = "flex";
    }

    function cerrarModal() {
      const modal = document.getElementById("modalConfirmacion");
      const box = modal.querySelector(".modal-box");

      modal.classList.add("fade-out");
      box.classList.add("fade-out");

      setTimeout(() => {
        modal.style.display = "none";
        modal.classList.remove("fade-out");
        box.classList.remove("fade-out");
      }, 200);
    }

    async function confirmarEnvio() {
      document.getElementById("modalConfirmacion").style.display = "none";
      document.getElementById("loadingOverlay").style.display = "flex";

      try {
        await fetch("/health");
        setTimeout(() => {
          form.submit();
        }, 2000);
      } catch (e) {
        alert("El servidor se está iniciando, intenta nuevamente en unos segundos.");
        document.getElementById("loadingOverlay").style.display = "none";
      }
    }

  </script>

  <div id="loadingOverlay" class="loading-overlay">
    <div class="loader-box">
      <div class="spinner"></div>
      <p>Enviando formulario…</p>
    </div>
  </div>

  </body>
  </html>
  `);
}

/* =====================================================
   RUTAS FORMULARIOS
===================================================== */
app.get("/", (req, res) =>
  renderFormulario(
    res,
    "¿Cómo estamos? ¿Cómo vamos?",
    `
      <strong>Apreciado Rector(a)</strong>
      <p>
        Con el propósito de tomar decisiones pertinentes frente a las acciones de formación,
        asesoría y acompañamiento a desarrollar en las instituciones educativas que aplican
        el modelo educativo rural con Escuela Nueva, le invitamos a diligenciar el siguiente
        formulario diagnóstico.
      </p>
    `,
    estrategiasEscuelaNueva,
    "/enviar/escuela-nueva"
  )
);


app.get("/ppp", (req, res) =>
  renderFormulario(
    res,
    "Proyectos Pedagógicos Productivos (PPP)",
    `
      <strong>Apreciado Rector(a) y/o docente líder</strong>
      <p>
        Con el propósito de tomar decisiones pertinentes frente a las acciones de formación,
        asesoría y acompañamiento a desarrollar en las instituciones educativas que aplican
        los Proyectos Pedagógicos Productivos, le invitamos a diligenciar el siguiente
        formulario diagnóstico.
      </p>
    `,
    estrategiasPPP,
    "/enviar/ppp"
  )
);


app.get("/escuela-virtual", (req, res) =>
  renderFormulario(
    res,
    "Escuela Virtual",
    `
      <strong>Apreciado Rector(a) y/o docente líder</strong>
      <p>
        Con el propósito de tomar decisiones pertinentes frente a las acciones de formación,
        asesoría y acompañamiento a desarrollar en las instituciones educativas que aplican
        el proyecto Escuela Virtual, le invitamos a diligenciar el siguiente formulario
        diagnóstico.
      </p>
    `,
    estrategiasEscuelaVirtual,
    "/enviar/escuela-virtual"
  )
);


app.get("/emprendimiento", (req, res) =>
  renderFormulario(
    res,
    "Emprendimiento",
    `
      <strong>Apreciado Rector(a) y/o docente líder</strong>
      <p>
        Con el propósito de tomar decisiones pertinentes frente a las acciones de formación,
        asesoría y acompañamiento a desarrollar en las instituciones educativas que aplican
        la línea de Emprendimiento, le invitamos a diligenciar el siguiente formulario
        diagnóstico.
      </p>
    `,
    estrategiasEmprendimiento,
    "/enviar/emprendimiento"
  )
);


/* =====================================================
   GUARDAR RESPUESTAS
===================================================== */
async function guardarFormulario(req, res, nombreFormulario) {
  const client = await pool.connect();

  try {
    /* ===============================
       VALIDACIÓN BÁSICA
    =============================== */
    if (!req.body || !req.body.estrategias) {
      throw new Error("No llegaron estrategias en el formulario");
    }

    const estrategias = Array.isArray(req.body.estrategias)
      ? req.body.estrategias
      : Object.values(req.body.estrategias);

    /* 🔎 LOG CLAVE (AQUÍ VA) */
    console.log("📥 Formulario recibido:", {
      formulario: nombreFormulario,
      municipio: req.body.municipio,
      institucion: req.body.institucion,
      totalEstrategias: estrategias.length
    });

    /* ===============================
       TRANSACCIÓN
    =============================== */
    await client.query("BEGIN");

    /* ===============================
       1️⃣ INSERTAR RESPUESTA BASE
    =============================== */
    const r = await client.query(`
      INSERT INTO respuestas(formulario, nombre, municipio, institucion)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      nombreFormulario,
      req.body.nombre,
      req.body.municipio,
      req.body.institucion
    ]);

    const respuestaId = r.rows[0].id;

    /* ===============================
       2️⃣ INSERTAR ESTRATEGIAS
    =============================== */
    for (const e of estrategias) {
      await client.query(`
        INSERT INTO estrategias_respuesta
        (respuesta_id, nombre_estrategia, tipo, estado, valor, observaciones)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        respuestaId,
        e.nombre,
        e.tipo,
        e.estado || null,
        e.valor || null,
        e.observaciones
      ]);
    }

    await client.query("COMMIT");
    res.redirect("/gracias");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error guardando formulario:", err);
    res.status(500).send("Error guardando el formulario");
  } finally {
    client.release();
  }
}

app.post("/enviar/escuela-nueva", (r, s) => guardarFormulario(r, s, "Modelo Escuela Nueva"));
app.post("/enviar/ppp", (r, s) => guardarFormulario(r, s, "Proyectos Pedagógicos Productivos (PPP)"));
app.post("/enviar/escuela-virtual", (r, s) => guardarFormulario(r, s, "Escuela Virtual"));
app.post("/enviar/emprendimiento", (r, s) => guardarFormulario(r, s, "Emprendimiento"));

/* =====================================================
   PÁGINA GRACIAS
===================================================== */
app.get("/gracias", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Formulario enviado</title>
      <link rel="stylesheet" href="/styles-formularios.css">
    </head>
    <body>

      <main class="container">
        <section class="card success-card">
          <div class="icon-success">✔</div>

          <h1>Formulario enviado correctamente</h1>

          <p>
            Gracias por diligenciar el formulario.<br>
            La información fue registrada exitosamente.
          </p>

          <p class="nota">
            Sus respuestas serán utilizadas para el análisis y fortalecimiento
            de los procesos educativos.
          </p>

          <div class="success-actions">
            <a href="/" class="btn-primary">Enviar otro formulario</a>
          </div>
        </section>
      </main>

    </body>
    </html>
  `);
});

/* =====================================================
   PANEL ADMIN — HOME
===================================================== */
app.get("/admin", async (req, res) => {

  const resumen = {};
  await pool.query("SELECT 1");


  // Recorremos el catálogo de formularios
  for (const formulario of Object.keys(catalogoFormularios)) {

    const { rows } = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM respuestas
      WHERE formulario = $1
    `, [formulario]);

    resumen[formulario] = {
      total: rows[0].total
    };
  }

  // =============================
  // RENDER HTML
  // =============================
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Panel Administrador</title>
  <link rel="stylesheet" href="/styles-admin.css">
</head>
<body>
<main class="container">

<section class="card">
  <h1>Panel Administrador</h1>
  <p class="subtitle">
    Visualización general para seguimiento y toma de decisiones pedagógicas
  </p>

  <div class="admin-grid">
    ${Object.keys(catalogoFormularios).map(f => {
      const r = resumen[f];

      return `
        <a class="admin-card"
           href="/admin/formulario/${encodeURIComponent(f)}">

          <h3 class="admin-card-title">
            ${catalogoFormularios[f]}
          </h3>

          <div class="admin-metrics">
            <div class="metric">
              <strong>${r.total}</strong>
              <small>Respuestas registradas</small>
            </div>
          </div>

        </a>
      `;
    }).join("")}
  </div>
</section>

</main>
</body>
</html>
  `);
});
/* =====================================================
   PANEL ADMIN — FORMULARIO (DASHBOARD + INSIGHTS)
===================================================== */
app.get("/admin/formulario/:nombre/export", async (req, res) => {
  const formulario = decodeURIComponent(req.params.nombre);

  try {
    /* =====================================================
       1️⃣ RESPUESTAS BASE
    ===================================================== */
    const respuestas = await pool.query(`
      SELECT id, municipio, institucion
      FROM respuestas
      WHERE formulario = $1
      ORDER BY municipio, institucion
    `, [formulario]);

    /* =====================================================
       2️⃣ ESTRATEGIAS DEL FORMULARIO
    ===================================================== */
    const estrategiasDB = await pool.query(`
      SELECT DISTINCT nombre_estrategia
      FROM estrategias_respuesta er
      JOIN respuestas r ON r.id = er.respuesta_id
      WHERE r.formulario = $1
      ORDER BY nombre_estrategia
    `, [formulario]);

    const estrategias = estrategiasDB.rows.map(e => e.nombre_estrategia);

    /* =====================================================
       3️⃣ CREAR EXCEL
    ===================================================== */
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Respuestas");

    // Columnas base
    const columnas = [
      { header: "Municipio", key: "municipio", width: 25 },
      { header: "Institución", key: "institucion", width: 40 },
      { header: "Semáforo", key: "semaforo", width: 15 }
    ];

    // Columnas dinámicas por estrategia
    estrategias.forEach((nombre, i) => {
      columnas.push(
        {
          header: nombre,
          key: `estrategia_${i}`,
          width: 30
        },
        {
          header: `Observación ${i + 1}`,
          key: `observacion_${i}`,
          width: 40
        }
      );
    });

    sheet.columns = columnas;

    /* =====================================================
       4️⃣ LLENAR FILAS
    ===================================================== */
    for (const r of respuestas.rows) {

      const estDB = await pool.query(`
        SELECT nombre_estrategia, estado, observaciones
        FROM estrategias_respuesta
        WHERE respuesta_id = $1
      `, [r.id]);

      const estrategiasMap = {};
      let aplica = 0;
      let noAplica = 0;

      estDB.rows.forEach(e => {
        estrategiasMap[e.nombre_estrategia] = e;
        if (e.estado === "Aplica") aplica++;
        if (e.estado === "No aplica") noAplica++;
      });

      const semaforo = calcularSemaforoPorcentaje(aplica, noAplica);

      const fila = {
        municipio: r.municipio,
        institucion: r.institucion,
        semaforo
      };

      estrategias.forEach((nombre, i) => {
        const est = estrategiasMap[nombre];
        fila[`estrategia_${i}`] = est?.estado || "";
        fila[`observacion_${i}`] = est?.observaciones || "";
      });

      sheet.addRow(fila);
    }

    /* =====================================================
       5️⃣ DESCARGA
    ===================================================== */
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="formulario_${formulario}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generando Excel");
  }
});


app.get("/admin/formulario/:nombre", async (req, res) => {
  const formulario = decodeURIComponent(req.params.nombre);

  if (!catalogoFormularios[formulario]) {
    return res.send("Formulario no encontrado");
  }

  try {
    /* =====================================================
       1️⃣ RESPUESTAS BASE
    ===================================================== */
    const respuestas = await pool.query(`
      SELECT id, nombre, municipio, institucion, fecha
      FROM respuestas
      WHERE formulario = $1
      ORDER BY fecha DESC
    `, [formulario]);

    /* =====================================================
      2️⃣ CALCULAR SEMÁFORO POR RESPUESTA
    ===================================================== */
    const filas = [];

    for (const r of respuestas.rows) {
      const est = await pool.query(`
        SELECT estado
        FROM estrategias_respuesta
        WHERE respuesta_id = $1
      `, [r.id]);

      const aplica = est.rows.filter(e => e.estado === "Aplica").length;
      const noAplica = est.rows.filter(e => e.estado === "No aplica").length;
      const semaforo = calcularSemaforoPorcentaje(aplica, noAplica);

      filas.push({
        id: r.id,
        municipio: r.municipio,
        institucion: r.institucion,
        semaforo
      });
    }

    /* =====================================================
      3️⃣ ORDENAR RESPUESTAS
    ===================================================== */
    const filtradas = filas.sort((a, b) => {
      const m = a.municipio.localeCompare(b.municipio);
      if (m !== 0) return m;
      return a.institucion.localeCompare(b.institucion);
    });


    /* =====================================================
       4️⃣ RESUMEN POR MUNICIPIO
    ===================================================== */
    const resumenMunicipios = {};

    filtradas.forEach(r => {
      if (!resumenMunicipios[r.municipio]) {
        resumenMunicipios[r.municipio] = { Verde: 0, Amarillo: 0, Rojo: 0 };
      }
      resumenMunicipios[r.municipio][r.semaforo]++;
    });

        /* =====================================================
       4️⃣.1 ORDENAR MUNICIPIOS POR CRITICIDAD
    ===================================================== */

    const municipiosOrdenados = Object.entries(resumenMunicipios)
      .map(([municipio, data]) => {
        const totalMunicipio = data.Verde + data.Amarillo + data.Rojo || 1;

        // promedio ponderado (verde=100, amarillo=60, rojo=20)
        const promedio =
          (data.Verde * 100 + data.Amarillo * 60 + data.Rojo * 20) / totalMunicipio;

        return {
          municipio,
          ...data,
          total: totalMunicipio,
          promedio
        };
      })
      .sort((a, b) => a.promedio - b.promedio); // más crítico arriba

    /* =====================================================
       5️⃣ MÉTRICAS DASHBOARD
    ===================================================== */
    const totalRespuestas = filtradas.length;
    const verdes = filtradas.filter(r => r.semaforo === "Verde").length;
    const amarillos = filtradas.filter(r => r.semaforo === "Amarillo").length;
    const rojos = filtradas.filter(r => r.semaforo === "Rojo").length;

    const pct = n =>
      totalRespuestas ? Math.round((n / totalRespuestas) * 100) : 0;

      /* =====================================================
        6️⃣ RESUMEN POR ESTRATEGIA
      ===================================================== */
      const resumenEstrategiasDB = await pool.query(`
        SELECT
          nombre_estrategia,
          COUNT(*) FILTER (WHERE estado = 'Aplica') AS aplica,
          COUNT(*) FILTER (WHERE estado = 'No aplica') AS no_aplica
        FROM estrategias_respuesta er
        JOIN respuestas r ON r.id = er.respuesta_id
        WHERE r.formulario = $1
        GROUP BY nombre_estrategia
        ORDER BY nombre_estrategia
      `, [formulario]);

      const estrategiasResumen = resumenEstrategiasDB.rows.map(e => {
        const aplica = Number(e.aplica);
        const noAplica = Number(e.no_aplica);
        const total = aplica + noAplica || 1;

        const porcentaje = Math.round((aplica / total) * 100);
        const estado = calcularSemaforoPorcentaje(aplica, noAplica).toLowerCase();

        return {
          nombre: e.nombre_estrategia,
          porcentaje,
          estado
        };
      });

    /* =====================================================
       7️⃣ INSIGHTS AUTOMÁTICOS
    ===================================================== */
    function generarInsights() {
      const insights = [];

      if (!totalRespuestas) {
        insights.push({
          tipo: "info",
          texto: "Aún no hay información suficiente para generar análisis."
        });
        return insights;
      }

      if (verdes > amarillos && verdes > rojos) {
        insights.push({
          tipo: "success",
          texto: "El panorama general es positivo: la mayoría de las instituciones presentan un estado favorable."
        });
      }

      if (rojos / totalRespuestas >= 0.3) {
        insights.push({
          tipo: "danger",
          texto: "Se identifica una proporción significativa de instituciones en estado crítico (rojo)."
        });
      }

      if (amarillos / totalRespuestas >= 0.3) {
        insights.push({
          tipo: "warning",
          texto: "Existe una oportunidad clara de mejora en instituciones con estado amarillo."
        });
      }

      if (verdes / totalRespuestas >= 0.6) {
        insights.push({
          tipo: "success",
          texto: "Más del 60% de las instituciones evaluadas se encuentran en estado verde."
        });
      }

      const municipiosCriticos = Object.entries(resumenMunicipios)
        .filter(([_, v]) => v.Rojo >= Math.max(v.Verde, v.Amarillo))
        .map(([m]) => m);

      if (municipiosCriticos.length) {
        insights.push({
          tipo: "danger",
          texto: `Municipios con mayor concentración de alertas rojas: ${municipiosCriticos.join(", ")}.`
        });
      }

      return insights;
    }

    const insights = generarInsights();

/* =====================================================
   8️⃣ RANKING DE INSTITUCIONES (PROMEDIO APLICA / NO APLICA)
===================================================== */

const rankingDB = await pool.query(`
  SELECT
    r.institucion,
    r.municipio,
    COUNT(*) FILTER (WHERE er.estado = 'Aplica') AS aplica,
    COUNT(*) FILTER (WHERE er.estado = 'No aplica') AS no_aplica
  FROM estrategias_respuesta er
  JOIN respuestas r ON r.id = er.respuesta_id
  WHERE r.formulario = $1
  GROUP BY r.institucion, r.municipio
`, [formulario]);

const ranking = rankingDB.rows
  .map(r => {
    const aplica = Number(r.aplica);
    const noAplica = Number(r.no_aplica);
    const nivel = calcularSemaforoPorcentaje(aplica, noAplica).toLowerCase();
    const porcentaje = Math.round((aplica / (aplica + noAplica || 1)) * 100);

    return {
      institucion: r.institucion,
      municipio: r.municipio,
      porcentaje,
      nivel,
    };
  })
  // ordenar del más crítico al más favorable
  .sort((a, b) => a.porcentaje - b.porcentaje);

    /* =====================================================
       🔟 RENDER HTML
    ===================================================== */
    res.send(`<!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>${catalogoFormularios[formulario]}</title>
          <link rel="stylesheet" href="/styles-admin.css">
        </head>
        <body>
        <main class="container">

        <section class="card">
          <header class="admin-header">
            <div>
              <h2>${catalogoFormularios[formulario]}</h2>
              <p class="subtitle">
                Panel de análisis para la toma de decisiones pedagógicas
              </p>
            </div>
          </header>

          <!-- KPIs -->
          <section class="dashboard-executive">
            <div class="kpi neutral">
              <span class="kpi-label">Respuestas enviadas</span>
              <span class="kpi-value">${totalRespuestas}</span>
            </div>

            <div class="kpi verde">
              <span class="kpi-label">Aplicación adecuada</span>
              <span class="kpi-value">${pct(verdes)}%</span>
              <span class="kpi-meta">${verdes} instituciones</span>
            </div>

            <div class="kpi amarillo">
              <span class="kpi-label">Aplicación con oportunidad de mejora</span>
              <span class="kpi-value">${pct(amarillos)}%</span>
              <span class="kpi-meta">${amarillos} instituciones</span>
            </div>

            <div class="kpi rojo">
              <span class="kpi-label">No aplica</span>
              <span class="kpi-value">${pct(rojos)}%</span>
              <span class="kpi-meta">${rojos} instituciones</span>
            </div>
          </section>
        </section>

        <!-- INSIGHTS -->
        <section class="card">
          <header>
            <h3>🧠 Insights automáticos</h3>
            <p class="subtitle">
              Análisis generado automáticamente a partir de los resultados
            </p>
          </header>

          <div class="insights-list">
            ${insights.map(i => `
              <div class="insight ${i.tipo}">
                ${i.texto}
              </div>
            `).join("")}
          </div>
        </section>

        <!-- RANKING -->
        <section class="card">
          <header>
            <h3>🔥 Instituciones con mayor nivel de riesgo</h3>
            <p class="subtitle">
              Ranking calculado automáticamente según el cumplimiento de estrategias
            </p>
          </header>

          <table class="ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Institución</th>
                <th>Municipio</th>
                <th>% Aplicación</th>
                <th>Semáforo</th>
              </tr>
            </thead>
            <tbody>
              ${ranking.slice(0,10).map((r,i)=>`
                <tr>
                  <td><strong>${i + 1}</strong></td>
                  <td>${r.institucion}</td>
                  <td>${r.municipio}</td>
                  <td>${r.porcentaje}%</td>
                  <td>
                    <span class="semaforo ${r.nivel}">
                      ${r.nivel.toUpperCase()}
                    </span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </section>

        <!-- ACCORDION: ESTRATEGIAS -->
        <details class="accordion">
          <summary>📊 Estado de las estrategias</summary>

          <section class="card">
            <div class="estrategias-dashboard">
              ${estrategiasResumen.map(e => `
                <div class="estrategia-row">
                  <div class="estrategia-info">
                    <span class="estrategia-nombre">${e.nombre}</span>
                    <span class="estrategia-porcentaje">${e.porcentaje}%</span>
                  </div>

                  <div class="barra-contenedor">
                    <div class="barra ${e.estado}" style="width:${e.porcentaje}%"></div>
                  </div>
                </div>
              `).join("")}
            </div>
          </section>
        </details>

        <!-- ACCORDION: MUNICIPIOS -->
        <details class="accordion">
          <summary>📍 Estado por municipio</summary>

          <section class="card">
            <div class="municipios-dashboard">
              ${municipiosOrdenados.map(m => {
                const v = Math.round((m.Verde / m.total) * 100);
                const a = Math.round((m.Amarillo / m.total) * 100);
                const r = Math.round((m.Rojo / m.total) * 100);

                return `
                  <div class="municipio-row">
                    <strong>${m.municipio}</strong>
                    <small>${m.total} instituciones</small>

                    <div class="barra-municipio">
                      <span class="verde" style="width:${v}%"></span>
                      <span class="amarillo" style="width:${a}%"></span>
                      <span class="rojo" style="width:${r}%"></span>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </section>
        </details>

        <section class="card">
          <header class="section-header">
            <h3>📋 Detalle de respuestas por institución</h3>
            <p class="section-subtitle">
              Registro individual de cada respuesta enviada
            </p>

            <div style="display:flex; justify-content: flex-end; margin-bottom:12px;">
              <a
                href="/admin/formulario/${encodeURIComponent(formulario)}/export"
                class="btn-primary"
              >
                ⬇ Descargar Excel
              </a>
            </div>

          </header>
          <table>
            <thead>
              <tr>
                <th>Municipio</th>
                <th>Institución</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              ${filtradas.map(r => `
                <tr>
                  <td>${r.municipio}</td>
                  <td>${r.institucion}</td>
                  <td>
                    <span class="semaforo ${r.semaforo.toLowerCase()}">
                      ${r.semaforo}
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn-secondary btn-sm"
                      onclick="verDetalle(${r.id})">
                      Ver detalle
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </section>

        <a href="/admin">⬅ Volver al panel</a>

        </main>

          <div id="detalle-modal" class="modal">
            <div class="modal-box">
              <h3>📄 Detalle de la respuesta</h3>

              <div id="detalle-contenido">
                <p>Cargando información…</p>
              </div>

              <div class="modal-actions">
                <button class="btn-secondary" onclick="cerrarDetalle()">
                  Cerrar
                </button>
              </div>
            </div>
          </div>

          <script>
            async function verDetalle(id) {
              const modal = document.getElementById("detalle-modal");
              const contenido = document.getElementById("detalle-contenido");

              document.body.style.overflow = "hidden"; // 🔥
              modal.style.display = "flex";
              contenido.innerHTML = "<p>Cargando información…</p>";

              try {
                const res = await fetch('/admin/detalle/' + id);
                const data = await res.text();
                contenido.innerHTML = data;
              } catch (err) {
                contenido.innerHTML = "<p>Error cargando el detalle.</p>";
              }
            }

            function cerrarDetalle() {
              document.getElementById("detalle-modal").style.display = "none";
              document.body.style.overflow = ""; // 🔥 restaura scroll
            }

          </script>
        </body>
      </html>`);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error cargando panel");
  }
});

app.get("/admin/detalle/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        r.municipio,
        r.institucion,
        er.nombre_estrategia,
        er.estado,
        er.observaciones
      FROM estrategias_respuesta er
      JOIN respuestas r ON r.id = er.respuesta_id
      WHERE er.respuesta_id = $1
      ORDER BY er.nombre_estrategia
    `, [id]);

    const { municipio, institucion } = result.rows[0] || {};

    res.send(`
      <div class="detalle-header">
        <div>
          <strong>Municipio:</strong> ${municipio || "-"}
        </div>
        <div>
          <strong>Institución:</strong> ${institucion || "-"}
        </div>
      </div>

      <div class="detalle-estrategias">
        ${result.rows.map(e => `
          <div class="detalle-card">
            <div class="detalle-card-header">
              <span class="detalle-estrategia">${e.nombre_estrategia}</span>
              <span class="detalle-estado ${e.estado === "Aplica" ? "verde" : "rojo"}">
                ${e.estado}
              </span>
            </div>

            <div class="detalle-observacion">
              ${e.observaciones || "Sin observaciones"}
            </div>
          </div>
        `).join("")}
      </div>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error cargando detalle");
  }
});

/* =====================================================
   SERVER
===================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Servidor en puerto", PORT));
