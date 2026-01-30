function actualizarPedidos_new() {
  const cfgP = CONFIG.PEDIDOS;
  const Hpedidos = getSheet('SS.PEDIDOS', 'SHEETS.PEDIDOS.PEDIDOS2');
  const Hsenias  = getSheet('SS.SENIAS',   'SHEETS.SENIAS.SENIAS');

  // ------------------- Etapa 1: capturar notas existentes (Orden + offset) -------------------
  const lastP = Hpedidos.getLastRow();
  const width = 7; // A..G
  const baseRow = cfgP.START_ROW;
  const rowsP = (lastP >= baseRow) ? Hpedidos.getRange(baseRow, 1, lastP - baseRow + 1, width).getValues() : [];

  const notasPorOrden = new Map();
  const orderRows = [];

  // Detectar orderRow: col A no vacía y distinta de 'pedido'
  for (let i = 0; i < rowsP.length; i++) {
    const a = rowsP[i][cfgP.ORDER_COL - 1];
    if (!a) continue;
    const s = String(a).trim();
    if (!s) continue;
    if (cfgP.ORDER_DETECT_EXCLUDE && cfgP.ORDER_DETECT_EXCLUDE.includes(s.toLowerCase())) continue;
    orderRows.push(baseRow + i);
  }
  orderRows.sort((a,b)=>a-b);

  // Guardar notas F..G como offset relativo a orderRow
  for (let b = 0; b < orderRows.length; b++) {
    const orderRowAbs = orderRows[b];
    const nextStart   = (b < orderRows.length - 1) ? orderRows[b+1] : (lastP + 1);
    const blockStart  = orderRowAbs + cfgP.HEADER_OFFSET_FROM_ORDER;
    const blockEnd    = nextStart - 1;

    const orden = String(Hpedidos.getRange(orderRowAbs, cfgP.ORDER_COL).getValue()).trim();
    if (!orden) continue;

    for (let r = blockStart; r <= blockEnd; r++) {
      const idx = r - baseRow;
      if (idx < 0 || idx >= rowsP.length) continue;

      const estado = rowsP[idx][cfgP.COLS_NOTAS.FROM - 1]; // F
      const diagn  = rowsP[idx][cfgP.COLS_NOTAS.TO   - 1]; // G
      const has = (estado && String(estado).trim()) || (diagn && String(diagn).trim());
      if (!has) continue;

      const offset = r - orderRowAbs; // 0 = fila del N° orden; +1 Tel+P1; +2 Total+P2; +3 Pago+P3; +4.. resto
      if (!notasPorOrden.has(orden)) notasPorOrden.set(orden, []);
      notasPorOrden.get(orden).push({ offset, fg: [estado || '', diagn || ''] });
    }
  }

  // ------------------- Etapa 2: leer Señas (fuente real) y mapear por Orden -------------------
  const lastS = Hsenias.getLastRow();
  if (lastS < 2) {
    if (lastP >= baseRow) Hpedidos.getRange(baseRow, 1, lastP - baseRow + 1, width).clearContent();
    return;
  }
  const colsS = Math.max(13, Hsenias.getLastColumn());
  const dataS = Hsenias.getRange(2, 1, lastS - 1, colsS).getValues();

  const ordenesSet = new Set();
  for (const row of dataS) {
    const ord = row[0];
    if (ord && String(ord).trim()) ordenesSet.add(String(ord).trim());
  }
  const Ordenes = Array.from(ordenesSet);

  // orden -> { cliente, tel, fecha, total, pago, productos:[{desc,cant}] }
  const mapOrden = new Map();
  for (const row of dataS) {
    const ordCell = row[0]; if (!ordCell) continue;
    const orden = String(ordCell).trim();

    const fecha   = row[1] || '';
    const prod    = row[2] || '';
    const cant    = row[3] || '';
    const cliente = row[7] || '';
    const total   = row[8] || '';
    const pago    = row[9] || '';
    const tel     = row[12] || '';

    if (!mapOrden.has(orden)) {
      mapOrden.set(orden, { cliente, tel, fecha, total, pago, productos: [] });
    }
    if (prod) mapOrden.get(orden).productos.push({ desc: prod, cant: cant || 1 });
  }

  // ------------------- Etapa 2b: construir mega-array A..G con TU layout -------------------
  const out = [];
  const headerRows = [];
  const orderRowIndexByOrden = new Map();
  let cursor = baseRow;

  for (const orden of Ordenes) {
    const info = mapOrden.get(orden) || { cliente:'', tel:'', fecha:'', total:'', pago:'', productos:[] };
    const prods = (info.productos || []).slice(); // copia
    const p1 = prods.length > 0 ? prods[0] : null;
    const p2 = prods.length > 1 ? prods[1] : null;
    const p3 = prods.length > 2 ? prods[2] : null;

    // 1) Header (verde)
    out.push([
      cfgP.HEADER_TITLES[0] || 'pedido',
      cfgP.HEADER_TITLES[1] || 'Cliente',
      cfgP.HEADER_TITLES[2] || 'Fecha',
      cfgP.HEADER_TITLES[3] || 'Productos',
      cfgP.HEADER_TITLES[4] || 'Unid',
      cfgP.HEADER_TITLES[5] || 'ESTADO',
      cfgP.HEADER_TITLES[6] || 'NOTAS',
     // cfgP.HEADER_TITLES[7] || 'NOTAS_ST'
      
    ]);
    headerRows.push(cursor); cursor++;

    // 2) Fila del Nº de orden (ancla) — D/E vacías
    out.push([
      orden,
      String(info.cliente || ''),
      info.fecha || '',
      '', '', '', ''
    ]);
    const orderRowIndex = cursor;
    orderRowIndexByOrden.set(orden, orderRowIndex);
    cursor++;

    // 3) Teléfono + PROD1
    out.push([
      '',
      `${cfgP.META_LABELS[0]} ${String(info.tel || '')}`,
      '',
      p1 ? String(p1.desc || '') : '',
      p1 ? String(p1.cant || '') : '',
      '', ''
    ]); cursor++;

    // 4) Total + PROD2
    out.push([
      '',
      `${cfgP.META_LABELS[1]} ${String(info.total || '')}`,
      '',
      p2 ? String(p2.desc || '') : '',
      p2 ? String(p2.cant || '') : '',
      '', ''
    ]); cursor++;

    // 5) Pago + PROD3
    out.push([
      '',
      `${cfgP.META_LABELS[2]} ${String(info.pago || '')}`,
      '',
      p3 ? String(p3.desc || '') : '',
      p3 ? String(p3.cant || '') : '',
      '', ''
    ]); cursor++;

    // 6) Resto de productos (del 4° en adelante), todos seguidos
    for (let i = 3; i < prods.length; i++) {
      const it = prods[i];
      out.push(['', '', '', String(it.desc || ''), String(it.cant || ''), '', '']);
      cursor++;
    }

    // 7) Separación entre bloques (2 filas vacías)
    for (let s = 0; s < cfgP.BLOCK_SPACING; s++) {
      out.push(['','','','','','','']); cursor++;
    }
  }

  // ------------------- Etapa 2c: reinyectar notas (F..G) por (orden, offset) -------------------
  for (const [orden, notas] of notasPorOrden.entries()) {
    const base = orderRowIndexByOrden.get(orden);
    if (!base) continue; // la orden ya no existe
    for (const n of notas) {
      const destAbs = base + n.offset;
      const idx = destAbs - baseRow;
      if (idx < 0 || idx >= out.length) continue;
      out[idx][cfgP.COLS_NOTAS.FROM - 1] = n.fg[0] || '';
      out[idx][cfgP.COLS_NOTAS.TO   - 1] = n.fg[1] || '';
    }
  }

  // ------------------- Pegado único + estilos -------------------
  if (lastP >= baseRow) {
    Hpedidos.getRange(baseRow, 1, lastP - baseRow + 1, width).clearContent();
  }
  if (out.length) {
    Hpedidos.getRange(baseRow, 1, out.length, width).setValues(out);
  }
  // Estilo header (verde + bold)
  if (headerRows.length) {
    const bg = '#00b050';
    headerRows.forEach(row => {
      Hpedidos.getRange(row, 1, 1, width).setBackground(bg).setFontWeight('bold');
    });
  }
}

