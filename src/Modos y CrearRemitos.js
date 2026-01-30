
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function modoVenta (hoja) 
{
  LIMPIAR_new("a")

    const Hoja_Caja1  = getSheet('SS.SOLUVENTAS', 'SHEETS.SOLUVENTAS.VENTAS');
    //nuevoinsert
    const CONFIGVENTAS = {
    rango:'J4:O4',
    costo : '=ARRAYFORMULA(IF(I4:I23>=0; IFNA(VLOOKUP(H4:H23; RAW_STOCK!$A:$J; 10; 0)); ""))',
    precio : '=ARRAYFORMULA(  IF(H4:H23=""; ;IF(I4:I23>=1; IFNA(VLOOKUP(H4:H23; RAW_STOCK!$A:$D; 4; 0)); )))',
    preciodesc : '=ARRAYFORMULA( IF(I4:I23>=1; ifna(VLOOKUP(H4:H23; RAW_STOCK!$A:$E; 5; 0));""))', 
    desc :  "",
    disponible :'=ARRAYFORMULA(  IF(H4:H23=""; ;    IFNA(VLOOKUP(H4:H23; RAW_STOCK!$A:$D; 3; 0))  ))' , 
    stock : '=ARRAYFORMULA(  IF(H4:H23=""; ;    IFNA(VLOOKUP(H4:H23; RAW_STOCK!$A:$Q; 17; 0))  ))',
    SKU: '=ARRAYFORMULA(  IF(H4:H23=""; ;    IFNA(VLOOKUP(H4:H23; RAW_STOCK!$A:$Q; 16; 0))  ))'
    }

    const formulasventa = [[CONFIGVENTAS.precio,CONFIGVENTAS.preciodesc,CONFIGVENTAS.desc,CONFIGVENTAS.disponible,CONFIGVENTAS.stock, CONFIGVENTAS.SKU]]
    Hoja_Caja1.getRange(CONFIGVENTAS.rango).setFormulas(formulasventa)
    Hoja_Caja1.getRange('G4').setFormula(CONFIGVENTAS.costo)
  //--------------------------------------------------------------------
  Hoja_Caja1.getRange('a2:f2').setValue('MODO VENTA/SEÑA')
  Hoja_Caja1.getRange('a2:f2').setBackground('#2e7942')
  Hoja_Caja1.getRange('G2:M2').setBackground('#5db489')
}

function modoVenta_B (hoja) 
{
  LIMPIAR_new()

    const Hoja_Caja1  = getSheet('SS.SOLUVENTAS', 'SHEETS.SOLUVENTAS.VENTA_B');
    //nuevoinsert
    const CONFIGVENTAS = {
    rango:'J4:O4',
    costo : '=ARRAYFORMULA(IF(I4:I23>=0; IFNA(VLOOKUP(H4:H23; RAW_STOCK!$A:$J; 10; 0)); ""))',
    precio : '=ARRAYFORMULA(  IF(H4:H23=""; ;IF(I4:I23>=1; IFNA(VLOOKUP(H4:H23; RAW_STOCK!$A:$D; 4; 0)); )))',
    preciodesc : '=ARRAYFORMULA( IF(I4:I23>=1; ifna(VLOOKUP(H4:H23; RAW_STOCK!$A:$E; 5; 0));""))', 
    desc :  "",
    disponible :'=ARRAYFORMULA(  IF(H4:H23=""; ;    IFNA(VLOOKUP(H4:H23; RAW_STOCK!$A:$D; 3; 0))  ))' , 
    stock : '=ARRAYFORMULA(  IF(H4:H23=""; ;    IFNA(VLOOKUP(H4:H23; RAW_STOCK!$A:$Q; 17; 0))  ))',
    SKU: '=ARRAYFORMULA(  IF(H4:H23=""; ;    IFNA(VLOOKUP(H4:H23; RAW_STOCK!$A:$Q; 16; 0))  ))'
    }


    const formulasventa = [[CONFIGVENTAS.precio,CONFIGVENTAS.preciodesc,CONFIGVENTAS.desc,CONFIGVENTAS.disponible,CONFIGVENTAS.stock, CONFIGVENTAS.SKU]]
    Hoja_Caja1.getRange(CONFIGVENTAS.rango).setFormulas(formulasventa)
        Hoja_Caja1.getRange('G4').setFormula(CONFIGVENTAS.costo)
  //--------------------------------------------------------------------
  Hoja_Caja1.getRange('a2:f2').setValue('MODO VENTA/SEÑA')
  Hoja_Caja1.getRange('a2:f2').setBackground('#2e7942')
  Hoja_Caja1.getRange('G2:M2').setBackground('#5db489')
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function modoSeña () {
    LIMPIAR_new("a")
    let Hoja_Caja1  = getSheet('SS.SOLUVENTAS', 'SHEETS.SOLUVENTAS.VENTAS');

  Hoja_Caja1.getRange("J4:J23").clearContent()
  Hoja_Caja1.getRange("k4:J23").clearContent()
  Hoja_Caja1.getRange('a2:f2').setBackground('#d35a00')
  Hoja_Caja1.getRange('a2:f2').setValue('MODO PEDIDOS')
   Hoja_Caja1.getRange('G2:M2').setBackground('#e99455')
}

function modoSeña_b () {
    LIMPIAR_new()

    let Hoja_Caja1  = getSheet('SS.SOLUVENTAS', 'SHEETS.SOLUVENTAS.VENTA_B');

  Hoja_Caja1.getRange("J4:J23").clearContent()
  Hoja_Caja1.getRange("k4:J23").clearContent()
  Hoja_Caja1.getRange('a2:f2').setBackground('#d35a00')
  Hoja_Caja1.getRange('a2:f2').setValue('MODO PEDIDOS')
   Hoja_Caja1.getRange('G2:M2').setBackground('#e99455')
}



////////////////////////---viejo------////////////////////////////////////////
const Sremitos = SpreadsheetApp.openById('1FDkz2XT6JnUqSdnmbWo8JAokGgYI4eWPVnNP8A_zLKU')

function crearremito (nombrehoja){
  const Hoja_remitos = Sremitos.getSheetByName("Remito");
  const Hoja_remSeña = Sremitos.getSheetByName("Seña");

   const tarj_monto = Hoja_Caja1.getRange ('b35').getValue()
  const tarj_cuotas = Hoja_Caja1.getRange ('b36').getValue()

  // Simplificado el manejo de hojas activas
  const hojaActiva = Ctipo === 'Seña' ? Hoja_remSeña : Hoja_remitos;


  Sremitos.setActiveSheet(hojaActiva, true);

  Sremitos.duplicateActiveSheet();

  let nuevoremito;
  let arraydatoremito = []
  if (Ctipo === 'Seña') {
    nuevoremito = Sremitos.getSheetByName("Copia de Seña");
  arraydatoremito=[["","",Cncliente,"","",fechadeldia],[Cdni,"","","","",""],["",CodOrden,"","","",""],["",totalrecibido,"","","",""]]
  nuevoremito.getRange(10,3,4,6).setValues(arraydatoremito)

  } else {
    nuevoremito = Sremitos.getSheetByName("Copia de Remito");
    const ordenValue = Ctipo === "SSeña" ? norden : CodOrden;

      arraydatoremito=[["","",Cncliente,"","",fechadeldia],[Cdni,"","","","",""],["",ordenValue,"","","",""]]
        nuevoremito.getRange(10,3,3,6).setValues(arraydatoremito)
  }
  nuevoremito.setName(nombrehoja);
let arrayproductos =[]
  let producto
  let cantidad
  let pvta
      
  if (descuentoaplicado<-1) {nuevoremito.getRange("i39").setValue(descuentoaplicado)
  }else  {   nuevoremito.getRange('G39:I39').clear(); }

    for (let i in Cproducto) {
         producto = Cproducto[i][1]
         cantidad = Cproducto[i][2]
         pvta = Cproducto[i][3];
      if (descuentoaplicado > 1 ) { //SI HAY RECARGO
          pvta = parseInt(pvta) + parseInt(pvta) * descuentoaplicado / (totalremito - descuentoaplicado);
          } 
      arrayproductos.push([producto,"","",cantidad,pvta])
      }
  
  nuevoremito.getRange(17,3,arrayproductos.length,5).setValues(arrayproductos)

    // --- DETALLE TARJETAS (opción A) -> Remito!G44 ---
  const cuotasRaw = String(Hoja_Caja1.getRange('B36').getDisplayValue() || '').trim();
  const totalesRaw = String(Hoja_Caja1.getRange('B35').getDisplayValue() || '').trim();

  let detalleTarjetas = '';

  if (cuotasRaw || totalesRaw) {
    const cuotasList = cuotasRaw ? cuotasRaw.split(';').map(s => s.trim()).filter(Boolean) : [];
    const totalesList = totalesRaw ? totalesRaw.split(';').map(s => s.trim()).filter(Boolean) : [];

    // Si hay datos incompletos o cantidades distintas, dejo fallback (no rompo nada)
    if (!cuotasList.length || !totalesList.length || cuotasList.length !== totalesList.length) {
      detalleTarjetas = `Detalle de tarjeta (manual): cuotas=${cuotasRaw || '-'} | total=${totalesRaw || '-'}`;
    } else {
      const lines = cuotasList.map((c, i) => `Tarjeta ${i + 1}: ${c} cuota(s) - Total tarjeta: ${totalesList[i]}`);
      detalleTarjetas = lines.join('\n');
    }
  }

  const celdaDetalle = nuevoremito.getRange('G44');
  if (detalleTarjetas) {
    celdaDetalle.setValue(detalleTarjetas);
  } else {
    celdaDetalle.clearContent();
  }

SpreadsheetApp.flush()
Ui.alert('REMITO CREADO');
}


function verifCrearRem(ventaAB) {

  let ventaAoB = 0
  if (ventaAB){
    ventaAoB=ventaAB
   }

  let hojass = Sremitos.getSheets();

  // Eliminar hojas que comienzan con "Copia de..."
  hojass.forEach(hoja => {
    if (hoja.getName().startsWith("Copia de")) {
      Sremitos.deleteSheet(hoja);
    }
  });

  // Refrescar la lista de hojas después de eliminar
  hojass = Sremitos.getSheets();

  // Buscar hojas existentes con nombre igual a Cncliente y contarlas
  let contador = 0;
  hojass.forEach(hoja => {
    if (hoja.getName().startsWith(Cncliente)) {
      contador++;
    }
  });

  // Si ya existe una hoja con ese nombre, agregar un sufijo numérico
  let nombreFinal = Cncliente;
  if (contador > 0) {
    nombreFinal += " " + contador;
  }

  // Llamar a crearremito con el nombre final
  crearremito(nombreFinal);
}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function traeVenta ()///SIN USO TODAVIA
{
  var ventasRegistro = actualizar.getRange(2, 1, lastrow-1, 11).getValues()
     //UBICACION DE ELEMENTOS DE CADA FILA DE "pedidospend" ---> 0=codigo 1=fecha 2=prodcto 3=unid 4=pvta 5=desc 6=costo 7=Ncliente 8=seña 9=tel 10=dni
  
   var x = 8
    var y = 3
  for (i in ventasRegistro){
    if (ventasRegistro[i].includes(norden)){
      if (y==3){ 
                Hoja_Caja1.getRange("b6").setValue(ventasRegistro[i][7])
                Hoja_Caja1.getRange("b7").setValue(ventasRegistro[i][10])
                Hoja_Caja1.getRange("b8").setValue(ventasRegistro[i][9])
                Hoja_Caja1.getRange("b21").setValue(ventasRegistro[i][8])
                Hoja_Caja1.getRange("b20").setValue(ventasRegistro[i][1])
                }
    y++
    Hoja_Caja1.getRange(y,x).setValue(ventasRegistro[i][2]);
    x++;Hoja_Caja1.getRange(y,x).setValue(ventasRegistro[i][3]);
    x++;Hoja_Caja1.getRange(y,x).setValue(ventasRegistro[i][4]);
    x = 13;Hoja_Caja1.getRange(y,x).setValue(ventasRegistro[i][5]);//descuento
    
      x=8
  } } 
  Ui.alert('REMITO CREADO')
  }


