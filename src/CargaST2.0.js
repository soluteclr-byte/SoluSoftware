/*******************************
 * CONFIGST
 *******************************/
const CONFIGST = {
  // En PRUEBA: ambos iguales. En PROD: distintos.
  SPREADSHEET_ID_CARGA: "1igpQJ48glztoNn9kUc2BMb9X-7uI_RNBSVJfChEk37c",
  SPREADSHEET_ID_DESTINO: "1K2WL7sFeywuVEULqkn6DJOXGxkUYF67zad6GZd8SKQg",

  SHEET_CARGA: "ST V1.1",
  SHEET_DESTINO: "ST_abiertos",

  GLOBAL_HEADER_ROW: 6,
  FIRST_BLOCK_START_ROW: 7, // primer bloque empieza debajo del header general
  BLOCK_ROWS: 7,
  BLOCK_COLS: 9, // A..I

  // Validaciones
  ESTADOS_MACRO: ["Ingresado", "En proceso", "Listo","Listo | avisado", "Garantía"],
  BANDERAS: ["Normal", "Consulta", "Respuesta recibida", "Espera","Problema","Sin Solución","No acepta trabajo ","Slack"],
  RESPONSABLES: ["Sin asignar", "Fabri", "Oscar", "Darío", "Joaquín", "Emanuel"],

  // Celda fecha límite en hoja de carga (confirmado)
  FECHA_LIMITE_CELL: "E17",
  // Remitos ST
  REMITOS_SPREADSHEET_ID: "1FDkz2XT6JnUqSdnmbWo8JAokGgYI4eWPVnNP8A_zLKU",
  REMITOS_TEMPLATE_SHEET: "S Tecnico",
};

/*******************************
 * ERRORES CONTROLADOS (solo 2 tipos con alert)
 *******************************/
class StValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ST_VALIDATION";
  }
}
class StLockError extends Error {
  constructor(message) {
    super(message);
    this.name = "ST_LOCK";
  }
}

/*******************************
 * ENTRY POINT
 *******************************/
function registrarServicioTecnico_ST() {
  const ui = SpreadsheetApp.getUi();
  const lock = LockService.getScriptLock();

  try {
    // 1) LOCK
    if (!lock.tryLock(30 * 1000)) {
      throw new StLockError("No se pudo obtener lock. Reintentá en unos segundos.");
    }

    // 2) Abrir libros y hojas (IDs separados para migración)
    const ssCarga = SpreadsheetApp.openById(CONFIGST.SPREADSHEET_ID_CARGA);
    const ssDest = SpreadsheetApp.openById(CONFIGST.SPREADSHEET_ID_DESTINO);

    const shCarga = ssCarga.getSheetByName(CONFIGST.SHEET_CARGA);
    const shDest = ssDest.getSheetByName(CONFIGST.SHEET_DESTINO);

    // 3) Leer carga
    const data = leerCargaST_(shCarga);

    // 4) Validar carga
    validarCargaST_(data);

    // 5) Calcular n° orden oficial (mismo criterio que tu script anterior)
    const nOrden = nOrdenST_(data.clienteNombre, data.clienteDni);

    // 6) Insertar bloque al final (ancla A; fallback D)
   const insertAfterRow = findInsertAfterRowByLastMergeA_(shDest);

    shDest.insertRowsAfter(insertAfterRow, CONFIGST.BLOCK_ROWS);
    const startRow = insertAfterRow + 1;


    // 7) Formatear bloque (merges + validaciones + alineación básica)
    aplicarFormatoBloque_(shDest, startRow);

    // 8) Escribir bloque
    escribirBloque_(shDest, startRow, data, nOrden);

    // 9) Limpiar carga (solo contenido)
    limpiarCargaST_(shCarga);

    // Nota: Sin mensajes de éxito (por tu regla).
  } catch (err) {
    // Solo alert para lock y validaciones.
    if (err && (err.name === "ST_LOCK" || err.name === "ST_VALIDATION")) {
      ui.alert(err.message);
      return;
    }
    // Otros errores: se re-lanzan (no agrego mensajes adicionales).
    throw err;
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/*******************************
 * LECTURA CARGA
 * Basado en tu layout "st carga (1).xlsx"
 *******************************/
function leerCargaST_(sh) {
  const asesor = sh.getRange("C3").getDisplayValue().trim();
  const tipoServicio = sh.getRange("C5").getDisplayValue().trim();

  const clienteNombre = sh.getRange("F3").getDisplayValue().trim();
  const clienteDni = sh.getRange("F4").getDisplayValue().trim();
  const clienteTel = sh.getRange("F5").getDisplayValue().trim();

  const tipoEquipoRaw = sh.getRange("C8").getDisplayValue().trim();
  const tipoEquipo = normalizarTipoEquipo_(tipoEquipoRaw);

  const marcaModelo = sh.getRange("C9").getDisplayValue().trim();

  const accesoriosOtros = sh.getRange("C10").getDisplayValue().trim();
  const password = sh.getRange("C11").getDisplayValue(); // puede ser vacío

  // Componentes (solo aplican si PC/Notebook, pero igual los leo)
  const cpu = sh.getRange("F7").getDisplayValue().trim();
  const ram = sh.getRange("F8").getDisplayValue().trim();
  const disco = sh.getRange("F9").getDisplayValue().trim();
  const gpu = sh.getRange("F10").getDisplayValue().trim();
  const fuente = sh.getRange("F11").getDisplayValue().trim();

  // Flags
  const pasoSoluCompra = Boolean(sh.getRange("D15").getValue());
  const garantia = Boolean(sh.getRange("D16").getValue());
  const chkFechaLimite = Boolean(sh.getRange("D17").getValue());
  const fechaLimite = sh.getRange(CONFIGST.FECHA_LIMITE_CELL).getValue(); // Date o vacío

  // Arranque mínimo (D18:D23) + extras
  const arr = sh.getRange("D18:D25").getValues().flat().map(v => Boolean(v));
  const arranque = {
    enciendeFuente: arr[0],
    enciendeMother: arr[1],
    daImagen: arr[2],
    iniciaWindows: arr[3],
    arranqueMenos1Min: arr[4],
    hayFalla: arr[5],
    requiereBackup: arr[6],
    cargadorNotebook: arr[7],
  };

  // Descripción cliente (3 líneas)
  const descCliente = sh.getRange("C28:C30").getDisplayValues().flat().map(s => String(s || "").trim());

  // Observaciones recepción (2 líneas)
  const obsRecepcion = sh.getRange("C32:C33").getDisplayValues().flat().map(s => String(s || "").trim());

  // Productos a incluir (hasta 5) bajo F20
  const productos = sh.getRange("F21:F25").getDisplayValues().flat().map(s => String(s || "").trim());

  return {
    asesor,
    tipoServicio,
    clienteNombre,
    clienteDni,
    clienteTel,
    tipoEquipo,
    marcaModelo,
    accesoriosOtros,
    password,
    cpu, ram, disco, gpu, fuente,
    pasoSoluCompra,
    garantia,
    chkFechaLimite,
    fechaLimite,
    arranque,
    descCliente,
    obsRecepcion,
    productos,
  };
}

/*******************************
 * VALIDACIONES
 *******************************/
function validarCargaST_(d) {
  const errores = [];

  // Obligatorios siempre
  if (!d.clienteNombre) errores.push("Falta nombre del cliente.");
  if (!d.clienteDni) errores.push("Falta DNI del cliente.");
  if (!d.clienteTel) errores.push("Falta teléfono del cliente.");
  if (!d.asesor) errores.push("Falta asesor.");
  if (!d.tipoServicio) errores.push("Falta tipo de servicio.");
  if (!d.tipoEquipo) errores.push("Falta tipo de equipo.");
  if (!d.marcaModelo) errores.push("Falta marca|modelo|distinción.");

  // Tipo equipo válido (normalizado)
  const tipoOk = ["PC", "Notebook", "Otros"].includes(d.tipoEquipo);
  if (!tipoOk) errores.push(`Tipo de equipo inválido: "${d.tipoEquipo}".`);

  // Componentes obligatorios si PC o Notebook
  if (d.tipoEquipo === "PC" || d.tipoEquipo === "Notebook") {
    if (!d.cpu) errores.push("Falta procesador (CPU).");
    if (!d.ram) errores.push("Falta cantidad de RAM.");
    if (!d.disco) errores.push("Falta disco/s.");
  }

  // Fecha límite: si check marcado, fecha obligatoria
  if (d.chkFechaLimite) {
    if (!d.fechaLimite) errores.push(`Fecha límite marcada pero sin fecha en ${CONFIGST.FECHA_LIMITE_CELL}.`);
  }

  // Descripción cliente: debe haber texto en al menos 1 de las 3 líneas
  const tieneDesc = d.descCliente.some(x => x && x.length > 0);
  if (!tieneDesc) errores.push("Falta descripción del cliente (debe haber texto).");

  // Arranque mínimo: al menos 1 true entre D18..D23
  const arrMin = [
    d.arranque.enciendeFuente,
    d.arranque.enciendeMother,
    d.arranque.daImagen,
    d.arranque.iniciaWindows,
    d.arranque.arranqueMenos1Min,
    d.arranque.hayFalla,
  ].some(Boolean);

  if (!arrMin) errores.push("Arranque mínimo: debe estar chequeada al menos 1 opción (fuente/mother/imagen/windows/<1min/falla).");

  if (errores.length) {
    throw new StValidationError("Validación fallida:\n- " + errores.join("\n- "));
  }
}

/*******************************
 * nOrden oficial (mismo criterio previo)
 * ddMM + 2 letras nombre + últimos 3 del DNI + "T"
 *******************************/
function nOrdenST_(nombre, dni) {
  const fechadeldia = Utilities.formatDate(new Date(), "GMT-3", "ddMM");
  const n2 = String(nombre || "").trim().slice(0, 2);
  const d3 = String(dni || "").trim().slice(-3);
  return String(fechadeldia).concat(n2).concat(d3).concat("T").concat("ST");  
}

/*******************************
 * Ubicar último bloque
 * 1) Intenta A (por bloque fijo de 7 filas)
 * 2) Fallback D buscando "Asesor:"
 *******************************/
function findLastBlockHeaderRow_(sh) {
  const lastRow = sh.getLastRow();
  if (lastRow < CONFIGST.FIRST_BLOCK_START_ROW) return null;

  // A) Intento por columna A
  const aVals = sh.getRange(CONFIGST.FIRST_BLOCK_START_ROW, 1, lastRow - CONFIGST.FIRST_BLOCK_START_ROW + 1, 1)
    .getDisplayValues()
    .flat();

  for (let i = aVals.length - 1; i >= 0; i--) {
    const v = String(aVals[i] || "").trim();
    if (v) {
      const row = CONFIGST.FIRST_BLOCK_START_ROW + i;
      // Normalizar a fila header del bloque, por tamaño fijo 7
      const offset = (row - CONFIGST.FIRST_BLOCK_START_ROW) % CONFIGST.BLOCK_ROWS;
      return row - offset;
    }
  }

  // B) Fallback por D buscando "Asesor:"
  const dVals = sh.getRange(CONFIGST.FIRST_BLOCK_START_ROW, 4, lastRow - CONFIGST.FIRST_BLOCK_START_ROW + 1, 1)
    .getDisplayValues()
    .flat();

  for (let i = dVals.length - 1; i >= 0; i--) {
    const v = String(dVals[i] || "").trim();
    if (v.startsWith("Asesor:")) {
      return CONFIGST.FIRST_BLOCK_START_ROW + i;
    }
  }

  return null;
}

/*******************************
 * Formato del bloque destino
 *******************************/
function aplicarFormatoBloque_(sh, startRow) {
  // Merge A/B/C por 7 filas
  sh.getRange(startRow, 1, CONFIGST.BLOCK_ROWS, 1).merge();
  sh.getRange(startRow, 2, CONFIGST.BLOCK_ROWS, 1).merge();
  sh.getRange(startRow, 3, CONFIGST.BLOCK_ROWS, 1).merge();

  // Alineación básica en A/B/C
  const rA = sh.getRange(startRow, 1);
  const rB = sh.getRange(startRow, 2);
  const rC = sh.getRange(startRow, 3);
  [rA, rB, rC].forEach(r => {
    r.setHorizontalAlignment("center");
    r.setVerticalAlignment("middle");
    r.setFontWeight("bold");
  });

  // Wrap y alineación texto resto del bloque
  sh.getRange(startRow, 4, CONFIGST.BLOCK_ROWS, CONFIGST.BLOCK_COLS - 3).setWrap(true).setVerticalAlignment("top");

  // Validaciones A/B/C (en la celda top-left del merge)
  rA.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIGST.ESTADOS_MACRO, true)
    .setAllowInvalid(false)
    .build());

  rB.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIGST.RESPONSABLES, true)
    .setAllowInvalid(false)
    .build());

  rC.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIGST.BANDERAS, true)
    .setAllowInvalid(false)
    .build());
}

/*******************************
 * Escritura del bloque (A..I, 7 filas)
 *******************************/
function escribirBloque_(sh, startRow, d, nOrden) {
  const fechaIngreso = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yy");

  const headerE = construirHeaderE_(d.tipoServicio, fechaIngreso, d.chkFechaLimite ? d.fechaLimite : null);

  // E(X+1): equipo + descripción + componentes
  const eEquipoDescComp = construirEquipoDescComp_(d.tipoEquipo, d.marcaModelo, d.cpu, d.ram, d.disco, d.gpu, d.fuente);

  // E(X+4): flags (Solu/Compra + Garantía)
  const eFlags = `Solu/Compra: ${boolSI_(d.pasoSoluCompra)} | Garantía: ${boolSI_(d.garantia)}`;

  // E(X+5): checklist arranque (+ backup + cargador)
  const eArr = construirChecklist_(d.arranque);

  const productos = (d.productos || []).slice(0, 5);

  const values = [
    // X (header)
    ["Ingresado", "Sin asignar", "Normal", `Asesor: ${d.asesor}`, headerE, "INGRESO", "NOTAS VENTA/CLIENTE", "DIAGNÓSTICO TÉCNICO", "PRODUCTOS/SERVICIOS"],

    // X+1
    ["", "", "", d.clienteNombre, eEquipoDescComp, d.descCliente[0] || "", "", "", productos[0] || ""],

    // X+2
    ["", "", "", d.clienteDni, d.accesoriosOtros || "", d.descCliente[1] || "", "", "", productos[1] || ""],

    // X+3
    ["", "", "", d.clienteTel, `PASS: ${d.password || ""}`, d.descCliente[2] || "", "", "", productos[2] || ""],

    // X+4
    ["", "", "", nOrden, eFlags, d.obsRecepcion[0] || "", "", "", productos[3] || ""],

    // X+5
    ["", "", "", "", eArr, d.obsRecepcion[1] || "", "", "", productos[4] || ""],

    // X+6
    ["", "", "", "", "", "", "", "", ""],
  ];

  sh.getRange(startRow, 1, CONFIGST.BLOCK_ROWS, CONFIGST.BLOCK_COLS).setValues(values);
}

function construirHeaderE_(tipoServicio, fechaIngreso, fechaLimite) {
  let s = `${tipoServicio} - ${fechaIngreso}`;
  if (fechaLimite) {
    const fl = (fechaLimite instanceof Date)
      ? Utilities.formatDate(fechaLimite, "GMT-3", "dd/MM/yy")
      : String(fechaLimite);
    s += ` | Límite: ${fl}`;
  }
  return s;
}

function construirEquipoDescComp_(tipoEquipo, marcaModelo, cpu, ram, disco, gpu, fuente) {
  const header = `${tipoEquipo} ${marcaModelo}`.trim();
  const comps = [];
  if (tipoEquipo === "PC" || tipoEquipo === "Notebook") {
    if (cpu) comps.push(`CPU: ${cpu}`);
    if (ram) comps.push(`RAM: ${ram}`);
    if (disco) comps.push(`DISCO: ${disco}`);
    if (gpu) comps.push(`GPU: ${gpu}`);
    if (fuente) comps.push(`FUENTE: ${fuente}`);
  }
  return comps.length ? `${header}\n\n${comps.join(" | ")}` : header;
}

function construirChecklist_(a) {
  return [
    `PWR:${boolSI_(a.enciendeFuente)}`,
    `MB:${boolSI_(a.enciendeMother)}`,
    `IMG:${boolSI_(a.daImagen)}`,
    `WIN:${boolSI_(a.iniciaWindows)}`,
    `<1m:${boolSI_(a.arranqueMenos1Min)}`,
    `Falla:${boolSI_(a.hayFalla)}`,
    `Backup:${boolSI_(a.requiereBackup)}`,
    `Carg:${boolSI_(a.cargadorNotebook)}`,
  ].join(" | ");
}

function boolSI_(b) {
  return b ? "SI" : "NO";
}

function normalizarTipoEquipo_(v) {
  const s = String(v || "").trim().toLowerCase();
  if (s === "pc") return "PC";
  if (s === "notebook" || s === "note" || s === "nb") return "Notebook";
  if (s === "otros" || s === "otro") return "Otros";
  return String(v || "").trim();
}

/*******************************
 * Limpieza de carga (solo contenido)
 *******************************/
function limpiarCargaST_(sh) {
  // Campos texto
  sh.getRangeList([
    "C3",      // asesor
    "C5",      // tipo servicio
    "F3:F5",   // nombre/dni/tel
    "C8",      // tipo equipo
    "C9",      // marca|modelo|distinción
    "C10",     // accesorios|otros
    "C11",     // password
    "F7:F11",  // cpu/ram/disco/gpu/fuente
    "C28:C30", // descripción cliente (3)
    "C32:C33", // observaciones recepción (2)
    "F21:F25", // productos (hasta 5)
    CONFIGST.FECHA_LIMITE_CELL, // fecha límite
  ]).clearContent();

 // Checkboxes: set FALSE (mantiene validación checkbox)
  sh.getRange("D15:D25").setValue(false);
}

/*******************************
 * (Opcional) Helper simple para botón: valida IDs configurados
 *******************************/
function _sanityCheckConfig() {
  if (!CONFIGST.SPREADSHEET_ID_CARGA || CONFIGST.SPREADSHEET_ID_CARGA === "PONER_ID_ACA") {
    throw new Error("Falta CONFIGST.SPREADSHEET_ID_CARGA");
  }
  if (!CONFIGST.SPREADSHEET_ID_DESTINO || CONFIGST.SPREADSHEET_ID_DESTINO === "PONER_ID_ACA") {
    throw new Error("Falta CONFIGST.SPREADSHEET_ID_DESTINO");
  }
}
function findInsertAfterRowByLastMergeA_(sh) {
  // Toma el END ROW del último merge vertical de la columna A y pega después.
  // Asume (confirmado por vos): TODO merge en A corresponde a un ticket.
  const aCol = sh.getRange(1, 1, sh.getMaxRows(), 1);
  const merged = aCol.getMergedRanges();

  let maxEnd = CONFIGST.GLOBAL_HEADER_ROW;

  for (const r of merged) {
    const start = r.getRow();
    if (start < CONFIGST.FIRST_BLOCK_START_ROW) continue; // ignora encabezados arriba
    const end = start + r.getNumRows() - 1;
    if (end > maxEnd) maxEnd = end;
  }

  // Fallback: si por alguna razón no hubiera merges en A, usar lastRow normal.
  if (maxEnd === CONFIGST.GLOBAL_HEADER_ROW) {
    const lr = sh.getLastRow();
    return lr >= CONFIGST.GLOBAL_HEADER_ROW ? lr : CONFIGST.GLOBAL_HEADER_ROW;
  }

  return maxEnd;
}
