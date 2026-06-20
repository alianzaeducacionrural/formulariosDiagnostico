// ── GAS Web App URL (actualizar tras desplegar) ───────────
// 1. Abrir gas/Code.gs en el editor de Google Apps Script
// 2. Desplegar → Implementación nueva → Web app
// 3. Copiar la URL aquí
var GAS_URL = "https://script.google.com/macros/s/AKfycbyE0X5PM8D1KR17wd0wBo8d4H8A1ezhbSPScLWvozOlfpNGJWD12VSSPaeJlL2FKW3K-w/exec";

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

// Combina las definiciones locales con la config del GAS,
// sin sobreescribir lo que el GAS ya devuelva.
function aplicarFormDefsLocales(config) {
  if (!config) return config;
  config.forms = config.forms || {};
  config.municipios = config.municipios || {};
  for (var slug in LOCAL_FORM_DEFS) {
    if (!config.forms[slug]) config.forms[slug] = LOCAL_FORM_DEFS[slug];
  }
  return config;
}
