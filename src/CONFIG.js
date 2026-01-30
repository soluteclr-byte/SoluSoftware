// ========================= CONFIG (SOLO CÓDIGO) ============================
// Centralización de IDs de libros, nombres de hojas y rangos SIN usar hojas
// ni propiedades. Modificar SOLO aquí cuando cambie algo.
//
// Sugerencia: mantener este bloque en su propio archivo .gs (por ej. _config.gs)
// y protegerlo con control de versiones.
// ==========================================================================

const CONFIG = Object.freeze({
  // IDs de libros (Spreadsheet)
  SS: {
    SOLUVENTAS   : '1igpQJ48glztoNn9kUc2BMb9X-7uI_RNBSVJfChEk37c',
    CAJAS_TMP    : '1jprbuOxY1YZ6ohPPz2ySYtlsuRLyVk6rkih2N4yU5B0',
    VENTAS_TMP   : '1v01F1IIHPQoddE1CFhioDn7dNnhpCtXn4b0T0LRIPmY',
    SENIAS       : '19Pd-4YaGQ1KNCAVxgAHowuRK7Xm-zKr5GoYreToXJ1c',
    REMITOS      : '1FDkz2XT6JnUqSdnmbWo8JAokGgYI4eWPVnNP8A_zLKU',
    PEDIDOS      : '1K2WL7sFeywuVEULqkn6DJOXGxkUYF67zad6GZd8SKQg',
    LOOK         : '16xkV-Y0yIV-3V07x7bvUPmbG3LwjdM0rteuV1WzYu1Q',
  },

  // Nombres de hojas por libro
  SHEETS: {
    SOLUVENTAS: {
      VENTAS       : 'Ventas',
      VENTA_B      : 'Venta (b)',   // ← trabajaremos aquí primero
      LISTA        : 'LISTA',
      RETIROS_CAJA : 'Retiros de caja',
      ST           : 'ST',

    },
    CAJAS_TMP: {
      LDIARIO_CAJA : 'Ldiario - caja',
      EGRESOS      : 'egresos',
    },
    VENTAS_TMP: {
      REGISTRO     : 'registro',
    },
    SENIAS: {
      SENIAS       : 'Señas',
    },
    REMITOS: {
      REMITO       : 'Remito',
      REMITO_SENIA : 'Seña',
      ST_ECNICO    : 'S Tecnico',
    },
    PEDIDOS: {
      PEDIDOS      : 'Pedidos',
      PEDIDOS2     : 'Pedidos2',
      ST_ACTUAL    : 'Servicio Tecnico Actual',
      RESPALDO     : 'respaldo',
    },
    LOOK: {
      SENIAS       : 'señas',
      CAJAS        : 'cajas',
    },
  },
  //------- Rangos del FRONT: "Venta (b)"
  RNG_B: {
    CLIENTE          : 'B8:B12',   // tipo, -, nombre, dni, tel
    NORDEN           : 'B20:B20',
    PAGOS            : 'E6:6',   // efectivo, tmp, tbco, tarjmp, otro, naranja, usd, usdt, naremma, totalRecibido
    TOTALES_1        : 'E17:E17',  // total a saldar
    TOTALES_2        : 'J25:J27',  // descuento aplicado, (J26), total remitofecha
    DESCUENTO_EXTRA  : 'H36:H36',
    MODO             : 'A2:F2',
    PRODUCTOS        : 'G4:O23',   // tabla productos (filtrar filas vacías por la col G)
    },
////------- Front de "Reservas"
    FRONT_B: {
  RNG_FECHA_ORDEN: 'B25',  // fecha mostrada en front
  RNG_PAGO_ACUM:   'B27',  // pago acumulado traído desde Señas
  RNG_DESC_ACUM:   'B30',   // descuento acumulado (0 si no existe en Señas)
  RNG_PRODUCTOS        : 'H4:O23',
},
////------- Para Hoja Pedidos
PEDIDOS: {
  START_ROW: 6,                 // primera fila del tablero
  ORDER_COL: 1,                 // A
  HEADER_OFFSET_FROM_ORDER: -1, // header verde está 1 arriba del orderRow
  BLOCK_SPACING: 2,             // 2 filas en blanco entre bloques
  COLS_NOTAS: { FROM: 6, TO: 7 },       // F..G (ESTADO, DIAGNOSTICO)

  // Meta (siempre 3 filas debajo del orderRow, en col B)
  META_LINES_FIXED: 3,
  META_LABELS: ['Teléfono:', 'Total:', 'Pago:'],

  // Títulos del encabezado (A..G)
  HEADER_TITLES: ['pedido','Cliente','Fecha','Productos','Unid','ESTADO','NOTAS'],

  // Detección de orden en col A: cualquier no-vacío que NO sea 'pedido'
  ORDER_DETECT_EXCLUDE: ['pedido']
},


});

// ------------------------ Helpers de acceso seguros ------------------------

/**
 * Obtiene un valor de CONFIG usando una ruta de puntos, p.ej. 'SS.SOLUVENTAS'
 * @param {string} path
 * @returns {string}
 */
function cfg(path) {
  const parts = String(path).split('.');
  let cur = CONFIG;
  for (const p of parts) {
    if (!cur || !Object.prototype.hasOwnProperty.call(cur, p)) {
      throw new Error('CONFIG faltante: ' + path);
    }
    cur = cur[p];
  }
  return cur;
}

/**
 * Abre un Spreadsheet por clave de CONFIG, p.ej. getSS('SS.SOLUVENTAS')
 * @param {string} path
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getSS(path) {
  const id = cfg(path);
  return SpreadsheetApp.openById(id);
}

/**
 * Obtiene una Sheet por libro y nombre, ambos desde CONFIG.
 * @param {string} ssPath   p.ej. 'SS.SOLUVENTAS'
 * @param {string} namePath p.ej. 'SHEETS.SOLUVENTAS.VENTA_B'
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(ssPath, namePath) {
  const ss = getSS(ssPath);
  const name = cfg(namePath);
  const sh = ss.getSheetByName(name);
  if (!sh) {
    throw new Error(`No existe la hoja "${name}" en el libro ${ssPath}`);
  }
  return sh;
}

// ---------------------- Snapshot Venta (b) (sin memo) ----------------------

/**

 * @returns {{
 *  cliente: {tipo:string, nombre:string, dni:string|number, tel:string|number, norden:any},
 *  pagos: {efectivo:number,tmp:number,tbco:number,tarjmp:number,otro:number,naranja:number,usd:number,usdt:number,naremma:number,totalRecibido:number},
 *  totales: {totalASaldar:number,descuentoAplicado:number,totalRemito:number,descuentoExtra:number,modo:any},
 *  productos: any[][]
 * }}
 */
function frontB_readSnapshot() {
  const sh = getSheet('SS.SOLUVENTAS', 'SHEETS.SOLUVENTAS.VENTA_B');

  // Cliente
  const c = sh.getRange(cfg('RNG_B.CLIENTE')).getValues().flat();
  const cliente = {
    tipo: c[0],
    nombre: c[2],
    dni: c[3],
    tel: c[4],
    norden: sh.getRange(cfg('RNG_B.NORDEN')).getValue(),
  };

  // Pagos (1 tiro)
  const p = sh.getRange(cfg('RNG_B.PAGOS')).getValues().flat();
  const pagos = {
    efectivo: p[0], tmp: p[1], tbco: p[2], tarjmp: p[3], otro: p[4],
    naranja: p[5], usd: p[6], usdt: p[7], naremma: p[8], totalRecibido: p[9],
  };

  // Totales / flags (2–3 tiros cortos, claros de mantener)
  const totalASaldar = sh.getRange(cfg('RNG_B.TOTALES_1')).getValue();
  const jj = sh.getRange(cfg('RNG_B.TOTALES_2')).getValues().flat(); // J25:J27
  const descuentoAplicado = jj[0];
  const totalRemito       = jj[2];
  const descuentoExtra = sh.getRange(cfg('RNG_B.DESCUENTO_EXTRA')).getValue();
  const modo           = sh.getRange(cfg('RNG_B.MODO')).getValue();
  const totales = { totalASaldar, descuentoAplicado, totalRemito, descuentoExtra, modo };

  // Productos (1 tiro)
  const rows = sh.getRange(cfg('RNG_B.PRODUCTOS')).getValues();
  const productos = rows.filter(r => r[0] !== ''); // filtra filas sin ID en col G

  return { cliente, pagos, totales, productos };
}

// ---------------------- Accesos listos para escrituras ---------------------
// Ejemplos de obtención de hojas de destino (usar dentro de tus funciones):
//
// const hojaCaja     = getSheet('SS.CAJAS_TMP',   'SHEETS.CAJAS_TMP.LDIARIO_CAJA');
// const hojaVentas   = getSheet('SS.VENTAS_TMP',  'SHEETS.VENTAS_TMP.REGISTRO');
// const hojaSenias   = getSheet('SS.SENIAS',      'SHEETS.SENIAS.SENIAS');
// const ssRemitos    = getSS('SS.REMITOS'); // y luego getSheet(...), copyTo, etc.
// const hojaPedidos  = getSheet('SS.PEDIDOS',     'SHEETS.PEDIDOS.PEDIDOS');
// ==========================================================================
// FIN CONFIG (SOLO CÓDIGO)
// ==========================================================================
