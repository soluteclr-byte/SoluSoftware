
function crearremito2 (Ctipo,totalrecibido,CodOrden2, Cncliente, Cdni, descuentoaplicado, datosRemito){

  Logger.log("CREANDO REMITO....")
/////// de funcion verificar
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
/////////// FINAL DE funcion verificar

  const Hoja_remitos = Sremitos.getSheetByName("Remito");
  const Hoja_remSeña = Sremitos.getSheetByName("Seña");

  // Simplificado el manejo de hojas activas
  const hojaActiva = Ctipo === 'Seña' ? Hoja_remSeña : Hoja_remitos;
  Sremitos.setActiveSheet(hojaActiva, true);

  Sremitos.duplicateActiveSheet();

  let nuevoremito;
  if (Ctipo === 'Seña') {
    nuevoremito = Sremitos.getSheetByName("Copia de Seña");
    nuevoremito.getRange("D13").setValue(totalrecibido);
    nuevoremito.getRange("D12").setValue(CodOrden);
  } else {
    nuevoremito = Sremitos.getSheetByName("Copia de Remito");
    const ordenValue = Ctipo === "SSeña" ? norden : CodOrden;
    nuevoremito.getRange("D12").setValue(ordenValue);
  }

  nuevoremito.getRange("h10").setValue(fechadeldia);
  nuevoremito.getRange("e10").setValue(Cncliente);
  nuevoremito.getRange("c11").setValue(Cdni);
  nuevoremito.getRange("I39").setValue(descuentoaplicado);

  nuevoremito.setName(nombreFinal);


nuevoremito.getRange(17,3,datosRemito.length,5).setValues(datosRemito)



   Ui.alert('REMITO CREADO');
}


// function verifCrearRem(ventaAB) {

//   let ventaAoB = 0
//   if (ventaAB){
//     ventaAoB=ventaAB
//    }

//   let hojass = Sremitos.getSheets();

//   // Eliminar hojas que comienzan con "Copia de..."
//   hojass.forEach(hoja => {
//     if (hoja.getName().startsWith("Copia de")) {
//       Sremitos.deleteSheet(hoja);
//     }
//   });

//   // Refrescar la lista de hojas después de eliminar
//   hojass = Sremitos.getSheets();

//   // Buscar hojas existentes con nombre igual a Cncliente y contarlas
//   let contador = 0;
//   hojass.forEach(hoja => {
//     if (hoja.getName().startsWith(Cncliente)) {
//       contador++;
//     }
//   });

//   // Si ya existe una hoja con ese nombre, agregar un sufijo numérico
//   let nombreFinal = Cncliente;
//   if (contador > 0) {
//     nombreFinal += " " + contador;
//   }

//   // Llamar a crearremito con el nombre final
//   crearremito(nombreFinal);
//   }

function cargaventa2 (){   

  const hojaVentas2 = activa.getSheetByName("Venta (b)")
    const datosCliente = hojaVentas2.getRange("b8:b12").getValues().flat()
      const Ctipo = datosCliente[0]
      const Cncliente = datosCliente[2]
      const Cdni = datosCliente[3]
      const Ctel = datosCliente[4]

    const datosTotales = hojaVentas2.getRange("J25:J27").getValues().flat()
      const descuentoaplicado = datosTotales[0]
      const totalremito = datosTotales[2]
    
    const datosPago = hojaVentas2.getRange("E6:E16").getValues().flat()
      const totalrecibido = datosPago[9]
      const pefectivo =  datosPago[0]
      const ptmp = datosPago[1]
      const ptbco = datosPago[2]
      const ptarjmp = datosPago[3]
      const potro = datosPago[4]
      const pnaranja = datosPago[5]
      const pUSD = datosPago[6]
      const pUSDT = datosPago[7]
      const ptemma = datosPago[8]
        const naremma = datosPago[8]

    const descuentoextra = hojaVentas2.getRange("h36").getValue()

    datosProductos = hojaVentas2.getRange('G4:O23').getValues()//rango que tiene productos
    const Cproducto = datosProductos .filter( elemento =>   elemento[0] !="")//saco las filas en blanco

    let datosRemito = []
    
  const CodOrden2 = CodOrden.slice(0,-1).concat(Ctipo.toString().slice(0,1))

    /// CAMBIAR PARA QUE SIEMPRE SE COLOQUE UN SOLO PRECIO
  
  //REGiSTRAR EN CAJA---
      let response = Ui.prompt("Escribi una referencia para CAJA").getResponseText()
        const pega_filacaja = [CodOrden2, fechadeldia, Cncliente, Cdni,Ctel, totalremito, descuentoaplicado,response,totalrecibido,pefectivo, ptmp, ptbco, ptarjmp, potro, pnaranja, pUSD, pUSDT, ptemma,naremma,descuentoextra]

      Hoja_RegCaja.appendRow(pega_filacaja)

        let x = (1+( descuentoaplicado/(totalremito-descuentoaplicado)))
        let sumapvta = 0
        let cantproductos = Cproducto.length

       

    for (i in Cproducto){
      let  costo = Cproducto[i][0]
      let  producto = Cproducto[i][1]
      let cantidad = Cproducto[i][2]
      let pvta = Cproducto[i][3]
      let desproducto = Cproducto[i][4]
      let SKU = Cproducto[i][8]
      datosRemito.push([producto,,,cantidad,pvta])

     if (isNaN(costo) || costo <= 0) {  Ui.alert("ERROR DE COSTO");return}
            
      if (descuentoaplicado !== 0) {
              desproducto=0; 
              pvta =  (pvta*x)
            // pvta = Math.round(temp/100)*100
      }
            sumapvta = (sumapvta+ pvta*cantidad)
          
      if (i==(cantproductos-1) && (sumapvta!=totalremito)){ 
            pvta = (pvta + (totalremito-sumapvta)/cantidad)
      }

      let pega_filaprdct = [CodOrden2,fechadeldia, producto,cantidad,pvta,desproducto, costo, Cncliente,"","","","","",SKU,timestamp]
   
     
          
          //CARGO EN PLANILLA VENTAS
      if (Ctipo=="Venta"){  
        
          Hoja_Regventas.appendRow (pega_filaprdct)
         }
          //CARGO EN PLANILLA "SEÑAS"
          // CARGO EN SEAS, AGREGO DATOS PARA TRAERLA
      if (Ctipo=="Seña"){    
        if (i==0){ // pega_filaprdct.push(totalremito,totalrecibido,descuentoaplicado,Cdni,Ctel)
        
        pega_filaprdct[0][8] = totalremito
        pega_filaprdct[0][9] = totalrecibido
        pega_filaprdct[0][10] = descuentoaplicado
         pega_filaprdct[0][11] = Cdni
          pega_filaprdct[0][12] = Ctel
   
        
        
        
        }     
       Hoja_Regseñas.appendRow(pega_filaprdct)    
      }
            
    }
 try {
  actualizarPedidos();
} catch (e) {
  console.error('actualizarPedidos() falló: ' + e.message);
}
      Ui.alert("REGISTRADO!! :D")
      SpreadsheetApp.flush()

  crearremito2 (Ctipo,totalrecibido,CodOrden2, Cncliente, Cdni, descuentoaplicado, datosRemito)
}