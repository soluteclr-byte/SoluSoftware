// Helper para armar el código de orden (misma idea que en tu script)
function buildCodOrdenFromCajaB(dni, tipo) {
  const hojaCaja = getSheet('SS.CAJAS_TMP', 'SHEETS.CAJAS_TMP.LDIARIO_CAJA');
  const last = Math.max(hojaCaja.getLastRow(), 1);
  const mmdd = Utilities.formatDate(new Date(), 'America/Argentina/La_Rioja', 'MMdd');
  const dni3 = (dni || '').toString().slice(-3);
  const tipo1 = (tipo || '').toString().slice(0, 1).toUpperCase();
  return mmdd + last + dni3 + tipo1;
}

function cargaventa2_new() {
  const Ui = SpreadsheetApp.getUi();

  // 1) Leer snapshot del front "Venta (b)" (bloques grandes)
  const { cliente, pagos, totales, productos } = frontB_readSnapshot();

  // 2) Mapear a nombres “históricos” (evita tocar tu lógica)
  const Ctipo     = String(cliente.tipo || '');
  const Cncliente = String(cliente.nombre || '');
  const Cdni      = cliente.dni || '';
  const Ctel      = cliente.tel || '';
  const norden    = cliente.norden || '';

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
  const modo               = String(totales.modo || '');

  const Cproducto = productos; // G4:O23 (filas no vacías)

  // 3) Timestamp y CodOrden (misma idea que tu cargaventa)
  const timestamp   = Utilities.formatDate(new Date(), 'America/Argentina/La_Rioja', 'dd/MM/yy HH:mm:ss');
  const fechadeldia = timestamp.split(' ')[0];
  const CodOrden    = buildCodOrdenFromCajaB(Cdni, Ctipo);

  // 4) Destinos (vía CONFIG)
  const Hoja_RegCaja   = getSheet('SS.CAJAS_TMP',  'SHEETS.CAJAS_TMP.LDIARIO_CAJA');
  const Hoja_Regventas = getSheet('SS.VENTAS_TMP', 'SHEETS.VENTAS_TMP.REGISTRO');
  const Hoja_Regseñas  = getSheet('SS.SENIAS',     'SHEETS.SENIAS.SENIAS');

// 5) VALIDACIONES + AJUSTE DE DESCUENTO (antes de escribir nada)
  let errores = [];
  let confirmacionesStock = [];
  let setSKU = new Set();
  let setNombre = new Set();
  let sumLista = 0; // suma de (pvta lista * cantidad) para prorratear
  let cantLineasValidas = 0;

  for (let i = 0; i < Cproducto.length; i++) {
    const fila = Cproducto[i];
    const costo     = +fila[0];
    const nombre    = String(fila[1] || '').trim();
    const cantidad  = +fila[2];
    const pvtaLista = +fila[3];       // precio de lista (sin descuento)
    const esproducto= fila[4];
    const stock     = +fila[6];
    const entrante  = +fila[7];
    const SKU       = String(fila[8] || '').trim();

    // Filas vacías/espurias: si no hay nombre ni SKU ni cantidad, saltear
    if (!nombre && !SKU && !cantidad) continue;

    // 5.1 Requisitos mínimos por ítem
    if (cantidad <= 0) errores.push(`Fila ${i+1}: cantidad inválida (${cantidad}).`);
    if (costo <= 0)    errores.push(`Fila ${i+1}: costo vacío/<=0.`);
    if (pvtaLista <= 0)errores.push(`Fila ${i+1}: pvta (lista) vacío/<=0.`);
    if (!SKU)          errores.push(`Fila ${i+1}: SKU vacío.`);

    // 5.2 Duplicados (clave: SKU si existe; si no, por nombre)
    const clave = SKU || nombre.toUpperCase();
    if (setSKU.has(clave) || setNombre.has(clave)) {
      errores.push(`Fila ${i+1}: ítem repetido (${SKU || nombre}).`);
    } else {
      // Track por ambos por robustez (sin colisiones)
      if (SKU) setSKU.add(clave); else setNombre.add(clave);
    }

    // 5.3 Stock / Entrante (solo confirmación)
    if (cantidad > 0 && stock <= 0) {
      if (entrante > 0) {
        confirmacionesStock.push(`Fila ${i+1}: "${nombre}" sin stock, en ENTRANTE (${entrante}).`);
      } else {
        confirmacionesStock.push(`Fila ${i+1}: "${nombre}" sin STOCK ni ENTRANTE.`);
      }
    }

    // 5.4 Acumular suma de lista
    if (cantidad > 0 && pvtaLista > 0) {
      sumLista += pvtaLista * cantidad;
      cantLineasValidas++;
    }
  }

  // 5.A Mostrar errores duros (abortan)
  if (errores.length > 0) {
    Ui.alert(
      'Errores en la carga',
      errores.join('\n'),
      Ui.ButtonSet.OK
    );
    return;
  }

  // 5.B Confirmaciones por stock/entrante
  if (confirmacionesStock.length > 0) {
    const r = Ui.alert(
      'Confirmar carga sin stock',
      confirmacionesStock.join('\n') + '\n\n¿Continuar de todas formas?',
      Ui.ButtonSet.YES_NO
    );
    if (r !== Ui.Button.YES) return;
  }

  // 5.C Verificación de totales (solo Venta) + tolerancia
  let _descuentoAplic = descuentoaplicado; // trabajamos sobre una copia "final"
  if (Ctipo === 'Venta') {
    const delta = totalrecibido - totalremito; // E15 - J27
    if (Math.abs(delta) > 100) {
      Ui.alert(
        'Diferencia de totales',
        `La diferencia entre E15 y J27 es ${delta.toFixed(2)} (supera $100). Revisá e intentá nuevamente.`,
        Ui.ButtonSet.OK
      );
      return;
    }
    // 5.D Ajuste: absorber delta en descuentoAplicado (puede volverlo más negativo o positivo)
    _descuentoAplic = (descuentoaplicado || 0) + delta;
  }

  // 5.E Factor de prorrateo para REGISTRO (precio efectivamente cobrado)
  // - Si no hay descuento/recargo final: factor = 1 (se usan precios de lista en registro)
  // - Si hay descuento/recargo: prorrateamos contra sumLista
  let factorRegistro = 1;
  if (sumLista > 0 && Math.abs(_descuentoAplic) > 0) {
    // total efectivamente cobrado = totalrecibido (coincidente con J27 ± tol) 
    factorRegistro = totalrecibido / sumLista;
  }

  let factorRegistro_final = factorRegistro
  let descuentoaplicado_final = descuentoaplicado

  // Guardamos en variables "finales" para usar en Caja/Remito/Registro


//------------------------------------------------------------
// 6) Registrar en Caja 
  const respuestaCaja = Ui.prompt("Escribí una referencia para CAJA").getResponseText();
  const filaCaja = [
    CodOrden, fechadeldia, Cncliente, Cdni, Ctel,
    totalremito, descuentoaplicado, respuestaCaja,
    totalrecibido, pefectivo, ptmp, ptbco, ptarjmp, potro, pnaranja, pUSD, pUSDT, naremma, descuentoextra
  ];
  Hoja_RegCaja.appendRow(filaCaja);


//------------------------------------------------------------
// 7) Preparar productos + datosRemito (sin ajustar último ítem)
  const arregloproductos = [];
  const datosRemito = [];

  for (let i = 0; i < Cproducto.length; i++) {
    const costo      = +Cproducto[i][0];
    const producto_  = String(Cproducto[i][1] || '').trim();
    const cantidad   = +Cproducto[i][2];
    const pvtaLista  = +Cproducto[i][3]; // precio de LISTA
    const esproducto =  Cproducto[i][4];
    const SKU        = String(Cproducto[i][8] || '').trim();

    // Saltar filas vacías
    if (!producto_ && !SKU && !cantidad) continue;
    if (cantidad <= 0 || pvtaLista <= 0) continue;

    // Precio para REGISTRO (lo efectivamente cobrado): prorrateado si hay descuento/recargo
    const pvtaRegistro = (factorRegistro_final !== 1)
      ? (pvtaLista * factorRegistro_final)
      : pvtaLista;

    // Precio para REMITO:
    // - Si hay DESCUENTO (negativo): SIEMPRE lista
    // - Si hay RECARGO (positivo): lista * factorRegistro (o sea, con recargo dentro del ítem)
    // - Si no hay ajuste: lista
    let pvtaRemito = pvtaLista;
    if (descuentoaplicado_final > 0) {
      pvtaRemito = (factorRegistro_final !== 1) ? (pvtaLista * factorRegistro_final) : pvtaLista;
    } // si es negativo o 0, queda lista

    // === Registros (Ventas/Señas) ===
    const desproducto = 0; // lo mantenés como en tu versión
    arregloproductos.push([
      CodOrden, fechadeldia, producto_, cantidad, pvtaRegistro, desproducto, costo, Cncliente,
      "","","","","", SKU, timestamp
    ]);

    // === Remito ===
    datosRemito.push([producto_, "", "", cantidad, pvtaRemito]);
  }


//------------------------------------------------------------
// 8) Remito (legacy) — LLAMAR DESPUÉS DEL FOR y ANTES de pegar en Ventas/Señas
//    (así usás exactamente los mismos pvta ajustados del loop)
//Sremitos         = getSS('SS.REMITOS');   // globals que la legacy lee
  this.fechadeldia = fechadeldia;
  this.CodOrden    = CodOrden;

  const descuentoParaRemito = (descuentoaplicado_final < 0) ? descuentoaplicado_final : ''; // vacío si recargo/0
  crearremito2(Ctipo, totalrecibido, CodOrden, Cncliente, Cdni, descuentoParaRemito, datosRemito);

  // 9) Pegar en Señas o Ventas (igual que lo venías haciendo)
  if (Ctipo === "Seña") {
    const start = Hoja_Regseñas.getLastRow() + 1;

    // ítems
    Hoja_Regseñas.getRange(start, 1, arregloproductos.length, arregloproductos[0].length)
                .setValues(arregloproductos);

    // bloque de pagos (col 9..13) — mismo shape: [totalremito, totalrecibido, descuentoaplicado, Cdni, Ctel]
    Hoja_Regseñas.getRange(start, 9, 1, 5).setValues([[totalremito, totalrecibido, descuentoaplicado, Cdni, Ctel]]);

  try {
    actualizarPedidos();
  } catch (e) {
    console.error('actualizarPedidos() falló: ' + e.message);
  }

    // (lo de Pedidos queda como lo tengas)
  } else {
    const start = Hoja_Regventas.getLastRow() + 1;
    Hoja_Regventas.getRange(start, 1, arregloproductos.length, arregloproductos[0].length)
                  .setValues(arregloproductos);
  }

  SpreadsheetApp.flush();
  Ui.alert("REGISTRADO!! :D");

  }
