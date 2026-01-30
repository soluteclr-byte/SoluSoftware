function traerSeña_new() {
  const ui = SpreadsheetApp.getUi();

  // Hojas por CONFIG (sin globals)
  const Hfront  = getSheet('SS.SOLUVENTAS', 'SHEETS.SOLUVENTAS.VENTA_B');
  const Hsenias = getSheet('SS.SENIAS',      'SHEETS.SENIAS.SENIAS');

  // --- 0) Verificar MODO PEDIDOS activo (A2:F2 debe tener marca/contenido) ---
  const modoRange = Hfront.getRange(CONFIG.RNG_B.MODO).getValues(); // A2:F2

  if (!modoRange[0].includes('MODO PEDIDOS')) {
    ui.alert('Activá el MODO PEDIDOS antes de traer la orden (A2:F2).');
    return;
  }

  // --- 1) Obtener N° de orden desde el front o pedirlo ---
  let norden = String(Hfront.getRange(cfg('RNG_B.NORDEN')).getValue() || '').trim();
  if (!norden) {
    const p = ui.prompt('Traer Seña', 'Ingresá el N° de orden:', ui.ButtonSet.OK_CANCEL);
    if (p.getSelectedButton() !== ui.Button.OK) return;           // <-- ui.Button.OK
    norden = String(p.getResponseText() || '').trim();
    if (!norden) { ui.alert('N° de orden vacío.'); return; }
    Hfront.getRange(cfg('RNG_B.NORDEN')).setValue(norden);
  }

  // --- 2) LIMPIAR front (si existe LIMPIAR_new) ---
  //try { if (typeof LIMPIAR_new === 'function') LIMPIAR_new(); } catch (_) {}

  // --- 3) Leer SEÑAS (A..O mínimo) y filtrar por orden ---
  const lastS = Hsenias.getLastRow();
  if (lastS < 2) { ui.alert('No hay registros en SEÑAS.'); return; }
  const lastCol = Math.max(15, Hsenias.getLastColumn()); // aseguramos col O (timestamp)
  const dataS = Hsenias.getRange(2, 1, lastS - 1, lastCol).getValues();

  const rowsOrden = [];
  for (let r = 0; r < dataS.length; r++) {
    const a = String(dataS[r][0] || '').trim(); // A = Orden
    if (a === norden) rowsOrden.push(dataS[r]);
  }
  if (!rowsOrden.length) { ui.alert('La orden no está en SEÑAS.'); return; }

  // --- 4) Detectar FILA CABECERA (cliente H no vacío + pago J número >=0) ---
  // Columnas usadas en SEÑAS:
  const COL = {
    ORDEN: 0, FECHA: 1, PROD: 2, CANT: 3, PVTA: 4,
    CLIENTE: 7, TOTAL: 8, PAGO: 9, DESC: 10, DNI: 11, TEL: 12,
    SKU: 13   // col 14 (0-based 13). La 15 (14) es timestamp y NO se usa.
  };

  const candidatas = rowsOrden.filter(r => {
    const clienteOk = String(r[COL.CLIENTE] || '').trim().length > 0;
    const pago = r[COL.PAGO];
    const pagoOk = (typeof pago === 'number') || (String(pago).trim() !== '' && !isNaN(+pago));
    return clienteOk && pagoOk;
  });

  if (candidatas.length === 0) {
    ui.alert('No se encontró una cabecera válida (cliente/pago) para la orden.');
    return;
  }
  if (candidatas.length > 1) {
    const detalle = candidatas.slice(0, 5).map(r =>
      `Cliente: ${r[COL.CLIENTE]} | Tel: ${r[COL.TEL]} | Fecha: ${r[COL.FECHA]} | Pago: ${r[COL.PAGO]} | Total: ${r[COL.TOTAL]} | DNI: ${r[COL.DNI]}`
    ).join('\n');
    ui.alert('Múltiples cabeceras detectadas.\nRevisá SEÑAS para unificar.\n\n' + detalle);
    return;
  }
  const cab = candidatas[0];

  const cliente = String(cab[COL.CLIENTE] || '').trim();
  const tel     = String(cab[COL.TEL]     || '').trim();
  const fecha   = cab[COL.FECHA] || '';
  const pagoAc  = Number(cab[COL.PAGO] || 0);     // siempre numérico (0 si no hubo pagos)
  const total   = cab[COL.TOTAL];                 // referencial (front recalcula por fórmulas)
  const dni     = String(cab[COL.DNI] || '').trim();
  const descAc  = Number(cab[COL.DESC] || 0);     // descuento acumulado desde SEÑAS (K). 0 si no hubo.

  // --- 5) Armar ÍTEMS válidos: C no vacío y D>0 ---
  const items = [];
  for (const r of rowsOrden) {
    const nombre = String(r[COL.PROD] || '').trim();
    const cant   = Number(r[COL.CANT] || 0);
    if (!nombre || !(cant > 0)) continue;
    const pvta   = Number(r[COL.PVTA] || 0);
    const sku    = String(r[COL.SKU] || '').trim();  // <-- ahora es el SKU real
    items.push({ nombre, cant, pvta, sku });
  }
  if (!items.length) { ui.alert('La orden no tiene productos válidos (sin nombre o cantidad > 0).'); return; }

  // --- 6) Pegar CABECERA en el front ---
  // B8:B12: [tipo, (en blanco), nombre, dni, tel] → usamos el rango ya definido en CONFIG
  const rCliente = Hfront.getRange(cfg('RNG_B.CLIENTE')); // 'B8:B12'
  const v        = rCliente.getValues();                  // preserva B8 y B9
  v[2][0] = cliente; // B10
  v[3][0] = dni;     // B11
  v[4][0] = tel;     // B12
  rCliente.setValues(v);

  // Fecha/Pago/Descuento a los NUEVOS rangos (B25, B27, B30)
  Hfront.getRange(CONFIG.FRONT_B.RNG_FECHA_ORDEN).setValue(fecha);
  Hfront.getRange(CONFIG.FRONT_B.RNG_PAGO_ACUM).setValue(pagoAc);
  Hfront.getRange(CONFIG.FRONT_B.RNG_DESC_ACUM).setValue(descAc);

  // --- 7) Pegar PRODUCTOS (solo 4 columnas: nombre, cant, pvta, sku) ---
  const prodRangeA1 = cfg('FRONT_B.RNG_PRODUCTOS');
  const prodRange   = Hfront.getRange(prodRangeA1);
  const rows = prodRange.getNumRows();
  const cols = prodRange.getNumColumns();

  // columnas relativas dentro del rango (1-based en Apps Script):
  const COL_NOMBRE = 1;
  const COL_CANT   = 2;
  const COL_PVTA   = 3;
  const COL_SKU    = 8;

  // Preparo matriz vacía con el ancho del rango
  const out = Array.from({ length: rows }, () => Array(cols).fill(''));

  // Escribo máximo hasta el alto disponible del front
  const n = Math.min(items.length, rows);
  for (let i = 0; i < n; i++) {
    const it = items[i];
    if (COL_NOMBRE <= cols) out[i][COL_NOMBRE - 1] = it.nombre;
    if (COL_CANT   <= cols) out[i][COL_CANT   - 1] = it.cant;
    if (COL_PVTA   <= cols) out[i][COL_PVTA   - 1] = it.pvta;
    if (COL_SKU    <= cols) out[i][COL_SKU    - 1] = it.sku;
  }

  // Limpiar y pegar de una
  prodRange.clearContent();
  prodRange.setValues(out);

  ui.alert(`Orden ${norden} cargada.\nCliente: ${cliente}\nÍtems: ${items.length}\nPago acumulado: ${pagoAc}\nDescuento acumulado: ${descAc}`);
}

function addaddseña_new() {
  const ui = SpreadsheetApp.getUi();

  // Hojas por CONFIG
  const Hfront  = getSheet('SS.SOLUVENTAS', 'SHEETS.SOLUVENTAS.VENTA_B');
  const Hsenias = getSheet('SS.SENIAS',      'SHEETS.SENIAS.SENIAS');
  const Hcaja   = getSheet('SS.CAJAS_TMP',        'SHEETS.CAJAS_TMP.LDIARIO_CAJA'); // mismo que usás en ventas

  // 1) Traer/validar orden (MODO y N° orden ya los valida traerSeña_new)
  traerSeña_new();

  // 2) Tomar orden y cabecera del front (ya cargados por traerSeña_new)
  const norden = String(Hfront.getRange(cfg('RNG_B.NORDEN')).getValue() || '').trim();
  if (!norden) { ui.alert('Falta el N° de orden.'); return; }

  // B8:B12 => [tipo, -, nombre, dni, tel] (ya lo usamos antes)
  const rCliente = Hfront.getRange(cfg('RNG_B.CLIENTE'));
  const vCliente = rCliente.getValues();
  const nombreCliente = String(vCliente[2][0] || '').trim(); // B10
  const dniCliente    = String(vCliente[3][0] || '').trim(); // B11
  const telCliente    = String(vCliente[4][0] || '').trim(); // B12

  // 3) Leer PAGOS y TOTALES del front con el MISMO código que usás en cargaventa2_new

    const {  pagos, totales,  } = frontB_readSnapshot();

  // EJEMPLO (solo la etapa de casteo, pegá tu lectura real):
 
  // ... (tu lectura real del front) ...
  const pefectivo     = +pagos.efectivo || 0;
  const ptmp          = +pagos.tmp || 0;
  const ptbco         = +pagos.tbco || 0;
  const ptarjmp       = +pagos.tarjmp || 0;
  const potro         = +pagos.otro || 0;
  const pnaranja      = +pagos.naranja || 0;
  const pUSD          = +pagos.usd || 0;
  const pUSDT         = +pagos.usdt || 0;
  const naremma       = pagos.naremma || '';
  const totalrecibido = +pagos.totalRecibido || 0;

  const totalremito        = +totales.totalRemito || 0;
  const totalasaldar       = +totales.totalASaldar || 0;
  const descuentoaplicado  = parseInt(totales.descuentoAplicado, 10) || 0;
  const descuentoextra     = +totales.descuentoExtra || 0;
  // --- END: pegar aquí la MISMA lectura que en cargaventa2_new ---

  if (!(totalrecibido > 0)) {
    ui.alert('Ingresá un monto válido (>0) en RECIBIDO.');
    return;
  }

  // 4) Confirmación explícita
  const conf = ui.alert(
    'Confirmar pago',
    `Orden: ${norden}\nCliente: ${nombreCliente}\nMonto a agregar: $${totalrecibido.toFixed(2)}\n\n¿Registrar este pago?`,
    ui.ButtonSet.YES_NO
  );
  if (conf !== ui.Button.YES) return;

  // 5) Ubicar FILA CABECERA en SEÑAS y sumar en col J
  const lastS = Hsenias.getLastRow();
  if (lastS < 2) { ui.alert('No hay registros en SEÑAS.'); return; }
  const lastCol = Math.max(15, Hsenias.getLastColumn()); // hasta col O
  const dataS = Hsenias.getRange(2, 1, lastS - 1, lastCol).getValues();

  const COL = { ORDEN:0, FECHA:1, PROD:2, CANT:3, PVTA:4, CLIENTE:7, TOTAL:8, PAGO:9, DESC:10, DNI:11, TEL:12, SKU:13 };

  const filasOrden = [];
  for (let i = 0; i < dataS.length; i++) {
    if (String(dataS[i][COL.ORDEN] || '').trim() === norden) filasOrden.push(i + 2); // fila real
  }
  const cabeceras = [];
  for (const fr of filasOrden) {
    const row = Hsenias.getRange(fr, 1, 1, lastCol).getValues()[0];
    const clienteOK = String(row[COL.CLIENTE] || '').trim().length > 0;
    const pagoOK    = (typeof row[COL.PAGO] === 'number') || (String(row[COL.PAGO]).trim() !== '' && !isNaN(+row[COL.PAGO]));
    if (clienteOK && pagoOK) cabeceras.push({ fr, row });
  }
  if (cabeceras.length === 0) { ui.alert('No se encontró cabecera válida para la orden.'); return; }
  if (cabeceras.length > 1) {
    const detalle = cabeceras.slice(0,5).map(c => {
      const r = c.row;
      return `Fila ${c.fr}: Cliente=${r[COL.CLIENTE]} | Pago=${r[COL.PAGO]} | Total=${r[COL.TOTAL]} | DNI=${r[COL.DNI]} | Tel=${r[COL.TEL]}`;
    }).join('\n');
    ui.alert('Múltiples cabeceras detectadas.\nRevisá SEÑAS para unificar.\n\n' + detalle);
    return;
  }
  const filaCab = cabeceras[0].fr;
  const pagoActual = Number(Hsenias.getRange(filaCab, COL.PAGO+1).getValue() || 0);
  const pagoNuevoAcum = Math.round((pagoActual + totalrecibido) * 100) / 100;

  Hsenias.getRange(filaCab, COL.PAGO + 1).setValue(pagoNuevoAcum); // col J

  // 6) Registrar en CAJA con el MISMO shape que ventas (y cliente con '+')
  const fechadeldia = Utilities.formatDate(new Date(), 'America/Argentina/La_Rioja', 'dd/MM/yy');

  const clienteCaja = nombreCliente ? (nombreCliente + '+') : '+';
  const descuentoaplicado_final = _descuentoAplic;

  // 6) Registrar en Caja 
  const respuestaCaja = Ui.prompt("Escribí una referencia para CAJA").getResponseText();
  const filaCaja = [
    CodOrden, fechadeldia, clienteCaja, Cdni, Ctel,
    totalremito, descuentoaplicado_final, respuestaCaja,
    totalrecibido, pefectivo, ptmp, ptbco, ptarjmp, potro, pnaranja, pUSD, pUSDT, naremma, descuentoextra
  ];
  Hoja_RegCaja.appendRow(filaCaja);

  // const rowCaja = [hoy, `Pago seña ${norden}`, totalrecibido, 0, norden, clienteCaja, dniCliente, medioPago, observacion, ts];
  // Hcaja.getRange(Hcaja.getLastRow()+1, 1, 1, rowCaja.length).setValues([rowCaja]);

  // --- END: pegar aquí el MISMO append a Caja que usás en cargaventa2_new ---

  // 7) Generar remito de pago (datosRemito desde el FRONT: prod|cant|precio)
  const prodRange = Hfront.getRange(cfg('RNG_B.PRODUCTOS'));
  const rowsP = prodRange.getNumRows(), colsP = prodRange.getNumColumns();
  const COL_NOMBRE = 2, COL_CANT = 3, COL_PVTA = 4; // relativos dentro de RNG_B.PRODUCTOS
  const m = prodRange.getValues();
  const datosRemito = [];
  for (let i = 0; i < rowsP; i++) {
    const nombre = String(m[i][COL_NOMBRE - 1] || '').trim();
    const cant   = Number(m[i][COL_CANT   - 1] || 0);
    const pvta   = Number(m[i][COL_PVTA   - 1] || 0);
    if (!nombre || !(cant > 0) || !(pvta > 0)) continue;
    datosRemito.push([nombre, "", "", cant, pvta]);
  }

  const Ctipo              = 'Seña';
  const totalrecibidoRem   = totalrecibido;
  const CodOrden2          = norden;
  const Cncliente          = nombreCliente;
  const Cdni               = dniCliente;


  if (typeof crearremito2 === 'function') {
    crearremito2(Ctipo, totalrecibidoRem, CodOrden2, Cncliente, Cdni, descuentoaplicado2, datosRemito);
  }

  // 8) Refrescar acumulado en front
  Hfront.getRange(CONFIG.FRONT_B.RNG_PAGO_ACUM).setValue(pagoNuevoAcum);

  ui.alert(`Pago registrado.\nOrden: ${norden}\nCliente: ${nombreCliente}\nMonto agregado: $${totalrecibido.toFixed(2)}\nAcumulado: $${pagoNuevoAcum.toFixed(2)}`);
}



function addproduct_new() {
  const Ui = SpreadsheetApp.getUi();

  // -------- Hojas según CONFIG --------
  const Hfront  = getSheet('SS.SOLUVENTAS', 'SHEETS.SOLUVENTAS.VENTA_B');
  const Hsenias = getSheet('SS.SENIAS',     'SHEETS.SENIAS.SENIAS');

  // -------- FRONT: orden, descuento extra, productos --------
  const norden = String(
    Hfront.getRange(cfg('RNG_B.NORDEN')).getValue() || ''
  ).trim();

  const descuentoExtra = +(
    Hfront.getRange(cfg('RNG_B.DESCUENTO_EXTRA')).getValue() || 0
  );

  const raw = Hfront.getRange(cfg('RNG_B.PRODUCTOS')).getValues();

  // Mapeo como en cargaventa2_new (G:O)
  // [0] costo, [1] nombre, [2] cantidad, [3] pvtaLista, [4] esproducto, [6] stock, [7] entrante, [8] SKU
  const productos = [];
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    const costo     = +r[0];
    const nombre    = String(r[1] || '').trim();
    const cantidad  = +r[2];
    const pvtaLista = +r[3];
    const esproducto= r[4];
    const stock     = +r[6];
    const entrante  = +r[7];
    const SKU       = String(r[8] || '').trim();

    // Saltar filas vacías (igual que cargaventa2_new)
    if (!nombre && !SKU && !cantidad) continue;
    productos.push({ i, costo, nombre, cantidad, pvtaLista, esproducto, stock, entrante, SKU });
  }

  // -------- Validaciones (calcadas de cargaventa2_new) --------
  if (!norden) {
    Ui.alert('Falta el número de orden en B20.');
    return;
  }
  if (productos.length === 0) {
    Ui.alert('No hay productos para agregar.');
    return;
  }

  const errores = [];
  const confirmacionesStock = [];
  const setSKU = new Set();
  const setNombre = new Set();
  let sumLista = 0;

  for (let k = 0; k < productos.length; k++) {
    const { i, costo, nombre, cantidad, pvtaLista, stock, entrante, SKU } = productos[k];

    if (cantidad <= 0) errores.push(`Fila ${i+1}: cantidad inválida (${cantidad}).`);
    if (costo    <= 0) errores.push(`Fila ${i+1}: costo vacío/<=0.`);
    if (pvtaLista<= 0) errores.push(`Fila ${i+1}: pvta (lista) vacío/<=0.`);
    if (!SKU)          errores.push(`Fila ${i+1}: SKU vacío.`);

    const clave = SKU || nombre.toUpperCase(); // duplicados por SKU o por nombre (igual que cargaventa2_new)
    if (setSKU.has(clave) || setNombre.has(clave)) {
      errores.push(`Fila ${i+1}: ítem repetido (${SKU || nombre}).`);
    } else {
      if (SKU) setSKU.add(clave); else setNombre.add(clave);
    }

    if (cantidad > 0 && stock <= 0) {
      if (entrante > 0) confirmacionesStock.push(`Fila ${i+1}: "${nombre}" sin stock, en ENTRANTE (${entrante}).`);
      else              confirmacionesStock.push(`Fila ${i+1}: "${nombre}" sin STOCK ni ENTRANTE.`);
    }

    if (cantidad > 0 && pvtaLista > 0) sumLista += pvtaLista * cantidad;
  }

  if (errores.length > 0) {
    Ui.alert('Errores en la carga', errores.join('\n'), Ui.ButtonSet.OK);
    return;
  }

  if (confirmacionesStock.length > 0) {
    const r = Ui.alert(
      'Confirmar carga sin stock',
      confirmacionesStock.join('\n') + '\n\n¿Continuar de todas formas?',
      Ui.ButtonSet.YES_NO
    );
    if (r !== Ui.Button.YES) return;
  }

  // -------- Señas: verificar existencia de la orden y productos ya presentes --------
  const lastS = Hsenias.getLastRow();
  if (lastS < 2) {
    Ui.alert('No hay registros en Señas.');
    return;
  }
  const colsS = Math.max(15, Hsenias.getLastColumn()); // Señas suele tener ≥15 (SKU y timestamp)
  const dataS = Hsenias.getRange(2, 1, lastS - 1, colsS).getValues();

  const filasOrden = [];
  const existentesNombre = [];
  const existentesSKU = new Set();
  let nombreCliente = '';

  for (let r = 0; r < dataS.length; r++) {
    const ord = String(dataS[r][0] || '').trim();
     if (ord !== norden) continue;

      filasOrden.push(r + 2);
      // Productos ya presentes (por nombre y/o SKU)
      const nombre = String(dataS[r][2] || '').trim(); // col 3: producto
      if (nombre) existentesNombre.push(nombre);
      // Si existe col SKU (col 15 si hay 15 columnas)
      const skuCell = colsS >= 15 ? String(dataS[r][14] || '').trim() : '';
      if (skuCell) existentesSKU.add(skuCell);
        // Capturar cliente
      if (!nombreCliente) {
    const c = String(dataS[r][7] || '').trim(); // col cliente en Señas
    if (c) nombreCliente = c;
  }
    
  }
  if (filasOrden.length === 0) {
    Ui.alert(`La orden ${norden} no existe en Señas.`);
    return;
  }

  // Aviso si los productos a agregar ya existen en la reserva
  const repetidosEnReserva = [];
  for (const p of productos) {
    if (p.SKU && existentesSKU.has(p.SKU)) repetidosEnReserva.push(p.nombre || p.SKU);
    else if (p.nombre && existentesNombre.includes(p.nombre)) repetidosEnReserva.push(p.nombre);
  }
  if (repetidosEnReserva.length > 0) {
    const resp = Ui.prompt(
      'Productos ya existentes en la orden',
     `En la orden ${norden}${nombreCliente ? ' (' + nombreCliente + ')' : ''} ya figuran:\n- ${repetidosEnReserva.join('\n- ')}\n\n` +
      'Escribí "si" para confirmar y agregar igualmente.',
      Ui.ButtonSet.OK
    ).getResponseText();
    if (String(resp).toLowerCase() !== 'si') {
      Ui.alert('Operación cancelada.');
      return;
    }
  }

  // -------- Prorrateo de DESCUENTO_EXTRA (ponderado) con factor uniforme --------
  // Mismo enfoque que cargaventa2_new: factor = (sumLista + descuentoExtra) / sumLista
  // (aplica el mismo % a cada ítem; negativo = descuento, positivo = recargo)
  const targetTotal = sumLista + (isFinite(descuentoExtra) ? descuentoExtra : 0);
  const factor = (sumLista > 0) ? (targetTotal / sumLista) : 1;

  // -------- Construir filas nuevas (shape compatible con Señas usada por actualizarPedidos_new) --------
  const hoy      = Utilities.formatDate(new Date(), 'America/Argentina/La_Rioja', 'dd/MM/yy');
  const ts       = Utilities.formatDate(new Date(), 'America/Argentina/La_Rioja', 'dd/MM/yy HH:mm:ss');

  const filas = [];
  let acumulado = 0;
  // Para cerrar redondeo al centavo, ajustamos el ÚLTIMO ítem
  const idxUlt = productos.length - 1;

  for (let k = 0; k < productos.length; k++) {
    const { nombre, cantidad, pvtaLista, costo, SKU } = productos[k];
    if (cantidad <= 0 || pvtaLista <= 0) continue; // ya validado, por seguridad

    let pvta = pvtaLista * factor;
    pvta = Math.round(pvta * 100) / 100;

    // cierre de redondeo: garantizar suma exacta a targetTotal
    const subtotal = pvta * cantidad;
    if (k < idxUlt) {
      acumulado += subtotal;
    } else {
      const delta = Math.round((targetTotal - acumulado) * 100) / 100;
      // Repartir delta del total faltante sobre la última línea (por unidad)
      const ajusteUnit = Math.round(((delta - subtotal) / cantidad) * 100) / 100;
      pvta = Math.round((pvta + ajusteUnit) * 100) / 100;
    }

    // Shape de Señas compatible con alta original:
    // [orden, fecha, producto, cant, pvta, desprod(0), costo, cliente(''), '', '', '', '', '', SKU, timestamp]
    filas.push([
      norden, hoy, nombre, cantidad, pvta, 0, costo, nombreCliente, '', '', '', '', '', SKU, ts
    ]);
  }

  if (!filas.length) {
    Ui.alert('No hay líneas válidas para agregar.');
    return;
  }

  const start = Hsenias.getLastRow() + 1;
  Hsenias.getRange(start, 1, filas.length, filas[0].length).setValues(filas);

  Ui.alert(`Se agregaron ${filas.length} producto(s) a la orden ${norden} de ${nombreCliente ? ' (' + nombreCliente + ')' : ''}.`);

  // -------- Refrescar PEDIDOS --------
  actualizarPedidos(); // mantiene compatibilidad con tu flujo actual
}

