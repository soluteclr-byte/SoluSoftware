/*******************************
 * registrarServicioTecnico_ST
 * CAMBIO: nOrden + "ST" al final (sin duplicarlo)
 * CAMBIO: remito no debe tener validaciones extra
 *******************************/
function registrarServicioTecnico_ST() {
  const ui = SpreadsheetApp.getUi();
  const lock = LockService.getScriptLock();

  try {
    if (!lock.tryLock(30 * 1000)) {
      throw new StLockError("No se pudo obtener lock. Reintentá en unos segundos.");
    }

    const ssCarga = SpreadsheetApp.openById(CONFIGST.SPREADSHEET_ID_CARGA);
    const ssDest = SpreadsheetApp.openById(CONFIGST.SPREADSHEET_ID_DESTINO);

    const shCarga = ssCarga.getSheetByName(CONFIGST.SHEET_CARGA);
    const shDest = ssDest.getSheetByName(CONFIGST.SHEET_DESTINO);

    const data = leerCargaST_(shCarga);
  

    // ✅ nOrden con sufijo ST (sin duplicarlo si ya lo tiene)
    let nOrden = String(nOrdenST_(data.clienteNombre, data.clienteDni) || "").trim();
    if (!nOrden.endsWith("ST")) nOrden += "ST";

    const insertAfterRow = findInsertAfterRowByLastMergeA_(shDest);
    shDest.insertRowsAfter(insertAfterRow, CONFIGST.BLOCK_ROWS);
    const startRow = insertAfterRow + 1;

    aplicarFormatoBloque_(shDest, startRow);
    escribirBloque_(shDest, startRow, data, nOrden);

    // ✅ REMITO (NO BLOQUEANTE, SIN VALIDACIONES EXTRA)
    generarRemitoST_noBloqueante_(data, nOrden);

    limpiarCargaST_(shCarga);

  } catch (err) {
    if (err && (err.name === "ST_LOCK" || err.name === "ST_VALIDATION")) {
      ui.alert(err.message);
      return;
    }
    throw err;
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}


/*******************************
 * REMITO ST (REFRESH)
 * REQ:
 * - Nunca frena el alta ST
 * - No valida campos del ticket (imprime lo que haya)
 * - Nombre hoja: "<Cliente> ST" + contador si duplica
 * - nOrden se imprime en la línea de cliente como "(<nOrden>)"
 * - NO imprimir "solo compra" ni "garantía"
 * - Toast SOLO si hubo duplicado (y nombre final)
 *******************************/
function generarRemitoST_noBloqueante_(d, nOrden) {
  try {
    const ssRem = SpreadsheetApp.openById(CONFIGST.REMITOS_SPREADSHEET_ID);
    const plantilla = ssRem.getSheetByName(CONFIGST.REMITOS_TEMPLATE_SHEET);
    if (!plantilla) throw new Error(`No existe la hoja plantilla "${CONFIGST.REMITOS_TEMPLATE_SHEET}".`);

    // Datos (sin validaciones: si faltan, quedan vacíos)
    const cliente = String(d.clienteNombre || "").trim();
    const dni = String(d.clienteDni || "").trim();
    const tel = String(d.clienteTel || "").trim();

    const fecha = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

    // Línea 4 (cliente): incluye nOrden entre paréntesis
    const lineaCliente =
      `El dia ${fecha} se recibe del cliente ${cliente} (${nOrden}) con DNI ${dni} y telefono ${tel}`;

    // Línea 5 (equipo + accesorios)
    const eq = construirEquipoLineaRemito_(d);
    const acc = String(d.accesoriosOtros || "").trim();
    const lineaEquipo = acc
      ? `Una ${eq} ademas de accesorios > ${acc}`
      : `Una ${eq} sin accesorios`;

    const datos1 = [[lineaCliente], [lineaEquipo]];

    // Bloque "C7:C18" (12 filas) y "C27:C38" (12 filas)
    const datos2 = construirBloqueDetallesRemito_(d);

    // Duplicar plantilla (sin depender de "hoja activa")
    const nueva = plantilla.copyTo(ssRem);

    // Nombre hoja (cliente + contador)
    const baseName = construirNombreRemitoBase_(cliente); // "<cliente> ST"
    const finalName = getUniqueSheetName_(ssRem, baseName);

    nueva.setName(finalName);

    // Toast SOLO si duplicó
    if (finalName !== baseName) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Remito duplicado, se nombró: ${finalName}`,
        "Remitos ST",
        5
      );
    }

    // Relleno (2 copias)
    nueva.getRange("C3").setValue(cliente);
    nueva.getRange("C23").setValue(cliente);

    nueva.getRange("B4:B5").setValues(datos1);
    nueva.getRange("B24:B25").setValues(datos1);

    nueva.getRange("C7:C18").setValues(datos2);
    nueva.getRange("C27:C38").setValues(datos2);

  } catch (err) {
    // No bloquea nunca
    Logger.log(`[Remito ST] Error: ${err && err.stack ? err.stack : err}`);
  }
}


/*******************************
 * Helpers REMITO
 *******************************/
function construirEquipoLineaRemito_(d) {
  // Sin validaciones: si faltan campos, se arma algo imprimible igual.
  const tipo = String(d.tipoEquipo || "").trim();
  const mm = String(d.marcaModelo || "").trim(); // si no existe, queda vacío
  const base = `${tipo} ${mm}`.trim();
  return base || "equipo";
}

function construirBloqueDetallesRemito_(d) {
  // 12 filas exactas para C7:C18 (y C27:C38)
  // NO imprime "solo compra / garantía" (removido).
  const comps = construirCaracteristicasRemito_(d);
  const arr = construirArranqueRemito_(d.arranque || {});
  const limite = construirFechaLimiteRemito_(d);

  const desc = (d.descCliente || []).slice(0, 3).map(x => String(x || "").trim());
  while (desc.length < 3) desc.push("");

  const obs = (d.obsRecepcion || []).slice(0, 2).map(x => String(x || "").trim());
  while (obs.length < 2) obs.push("");

  // Mantengo el estilo viejo: características / estado arranque / descripción / observaciones.
  // Completo hasta 12 líneas con blancos.
  const rows = [
    [comps],     // 1
    [arr],       // 2
    [desc[0]],   // 3
    [desc[1]],   // 4
    [desc[2]],   // 5
    [limite],    // 6  (solo si existe; sino blanco)
    [obs[0]],    // 7
    [obs[1]],    // 8
    [""],        // 9
    [""],        // 10
    [""],        // 11
    [""],        // 12
  ];

  return rows;
}

function construirCaracteristicasRemito_(d) {
  // Solo para PC/Notebook; si faltan campos, imprime lo que haya (sin cortar)
  const tipo = String(d.tipoEquipo || "").trim();
  if (tipo !== "PC" && tipo !== "Notebook") return "";

  const parts = [d.cpu, d.ram, d.disco, d.gpu, d.fuente]
    .map(x => String(x || "").trim())
    .filter(Boolean);

  return parts.join(" /");
}

function construirArranqueRemito_(a) {
  // Sin validaciones: siempre devuelve un texto
  const falla = Boolean(a.hayFalla);

  let base = "el equipo ";
  if (a.iniciaWindows) base += "SI inicia Windows";
  else if (a.daImagen) base += "SI da imagen";
  else if (a.enciendeMother) base += "SI enciende mother";
  else if (a.enciendeFuente) base += "SI enciende fuente";
  else base += "NO enciende";

  if (falla) base += " (con falla)";
  return base;
}

function construirFechaLimiteRemito_(d) {
  // Solo imprime si está marcado y hay fecha; si no, blanco
  if (!d.chkFechaLimite) return "";
  if (!d.fechaLimite) return "";
  try {
    const f = (d.fechaLimite instanceof Date) ? d.fechaLimite : new Date(d.fechaLimite);
    return `Limite: ${Utilities.formatDate(f, "GMT-3", "dd/MM/yyyy")}`;
  } catch (_) {
    return "";
  }
}

function construirNombreRemitoBase_(cliente) {
  // Debe ser "Nombre Cliente ST" (sin validaciones, con sanitización)
  let clean = sanitizeSheetName_(cliente);
  if (!clean) clean = "Sin nombre";
  let base = `${clean} ST`;
  if (base.length > 95) base = base.slice(0, 95);
  return base;
}

function sanitizeSheetName_(s) {
  // Google Sheets no permite: : \ / ? * [ ]
  return String(s || "")
    .replace(/[:\\\/\?\*\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getUniqueSheetName_(ss, baseName) {
  // Si existe baseName, devuelve baseName + " 1", " 2", ...
  let counter = 0;
  let uniqueName = baseName;
  while (sheetNameExists_(ss, uniqueName)) {
    counter++;
    uniqueName = `${baseName} ${counter}`;
  }
  return uniqueName;
}

function sheetNameExists_(ss, sheetName) {
  return ss.getSheets().some(sh => sh.getName() === sheetName);
}

