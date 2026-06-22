// ── GAS Web App URL (actualizar tras desplegar) ───────────
// 1. Abrir gas/Code.gs en el editor de Google Apps Script
// 2. Desplegar → Implementación nueva → Web app
// 3. Copiar la URL aquí
var GAS_URL = "https://script.google.com/macros/s/AKfycbw6qgH0Mp_6wqCtq0S8GgpHsiMjk-KhbDFv6-QqtZAEjcvDyLwrdlJGbvlgSriOO4GaRA/exec";

// ── Definiciones locales de respaldo ──────────────────────
// Permiten renderizar formularios nuevos aunque el GAS aún no
// esté redesplegado. Si el GAS ya devuelve el formulario, este
// respaldo se ignora.
var LOCAL_FORM_DEFS = {
  alianza_era: {
    title: "Alianza ERA",
    subtitle: "Alianza ERA",
    description: "<strong>Apreciado Rector(a) o Docente</strong><p>Con el propósito de tomar decisiones pertinentes frente a las acciones de formación, asesoría y acompañamiento que desarrolla la Alianza ERA en las instituciones educativas, le invitamos a diligenciar el siguiente formulario diagnóstico.</p>",
    libreUbicacion: true,
    pideCargo: true,
    pideRecomendaciones: true,
    recomendacionesLabel: "Recomendaciones para la alianza frente a la formación, asesoría y acompañamiento",
    aplicaOpciones: ["Aplica adecuadamente", "Aplica con oportunidad de mejora", "No aplica"],
    strategies: [
      { nombre: "Ambientación de las aulas", tipo: "aplica" },
      { nombre: "Hora de Gestión de Negocios", tipo: "aplica" },
      { nombre: "Manejo de instrumentos de gobierno estudiantil", tipo: "aplica" },
      { nombre: "Operatividad del Gobierno Estudiantil", tipo: "aplica" },
      { nombre: "Organización de los docentes en Microcentro", tipo: "aplica" },
      { nombre: "Realización de actividades de conjunto", tipo: "aplica" },
      { nombre: "Trabajo en equipo", tipo: "aplica" },
      { nombre: "Uso de guías de interaprendizaje con Escuela Nueva", tipo: "aplica" }
    ]
  }
};

// Combina las definiciones locales con la config del GAS.
// - Si el formulario no existe en la respuesta del GAS, se agrega completo.
// - Si existe pero le faltan campos (ej. aplicaOpciones porque el GAS aún
//   no está redesplegado), se completan SOLO los campos ausentes.
// Lo que el GAS ya devuelve siempre tiene prioridad.
function aplicarFormDefsLocales(config) {
  if (!config) return config;
  config.forms = config.forms || {};
  config.municipios = config.municipios || {};
  for (var slug in LOCAL_FORM_DEFS) {
    var def = LOCAL_FORM_DEFS[slug];
    if (!config.forms[slug]) {
      config.forms[slug] = def;
      continue;
    }
    var f = config.forms[slug];
    for (var k in def) {
      if (f[k] === undefined || f[k] === null || (Array.isArray(f[k]) && f[k].length === 0)) {
        f[k] = def[k];
      }
    }
  }
  return config;
}
