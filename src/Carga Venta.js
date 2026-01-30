
//---------------------------------------------------------------------
//---------------------------Variables---------------------------

//Spreadsheet principal - Frontend
  const activa = SpreadsheetApp.openById('1igpQJ48glztoNn9kUc2BMb9X-7uI_RNBSVJfChEk37c') // SOLUVENTAS
    let Hoja_Caja1 = activa.getSheetByName('Ventas') //FRONT - CARGA DE DATOS

const Ui = SpreadsheetApp.getUi() //ALERTAS

//Totales (suma de pagos, total remito, etc) - Hoja_Caja1
  var totalrecibido = Hoja_Caja1.getRange ("E16").getValue() //SUMA DE FORMAS DE PAGO
  var totalremito = Hoja_Caja1.getRange("J27").getValue() //TOTAL REMITO
  
  var totalasaldar = Hoja_Caja1.getRange ("E17").getValue() //QUEDA POR SALDAR
    var totalseñas = totalrecibido +  totalasaldar;

//Datos cargados 1 - Hoja_Caja1
  const Ctipo = Hoja_Caja1.getRange('b8').getValue() //Venta / Seña
  const Cncliente = Hoja_Caja1.getRange('b10').getValue()
  const Cdni = Hoja_Caja1.getRange('b11').getValue()
  const Ctel = Hoja_Caja1.getRange('b12').getValue()
//Arreglo productos - Hoja_Caja
  lala = Hoja_Caja1.getRange('G4:o23').getValues()//rango que tiene productos
  const Cproducto = lala .filter( elemento =>   elemento[0] !="")//saco las filas en blanco

//FORMA DE PAGO, CAJA - Hoja_Caja1
  const pefectivo = Hoja_Caja1.getRange ('E6').getValue()
  const ptmp =  Hoja_Caja1.getRange ('E7').getValue()
  const ptbco =  Hoja_Caja1.getRange ('E8').getValue()
  const ptarjmp =  Hoja_Caja1.getRange ('E9').getValue()
   const potro =  Hoja_Caja1.getRange ('e10').getValue()
  const pnaranja =  Hoja_Caja1.getRange ('E11').getValue()
  const pUSD =  Hoja_Caja1.getRange ('e12').getValue()
  const pUSDT =  Hoja_Caja1.getRange ('E13').getValue()
  const ptemma =  Hoja_Caja1.getRange ('e14').getValue()
  const pnaremma = Hoja_Caja1.getRange ('e15').getValue()
  
//otros -modos, descuentoextra,aplicado,fecha  Hoja_Caja1
  const modo = Hoja_Caja1.getRange("A2").getValue()
  const descuentoextra =Hoja_Caja1.getRange("H36").getValue()
  const descuentoaplicado = parseInt(Hoja_Caja1.getRange('J25').getValue())

  const timestamp = Utilities.formatDate(new Date(), 'GMT-3', "dd/MM/yy HH:mm:ss");
  const fechadeldia = timestamp.split(" ")[0]; 
 // const fechadeldia = Utilities.formatDate (new Date(), 'GMT-3', "dd/MM/YY")

//SS DE ESCRITURA DE DATOS
  
    //EN CAJA
      const SSvcajastemp = SpreadsheetApp.openById('1jprbuOxY1YZ6ohPPz2ySYtlsuRLyVk6rkih2N4yU5B0')  //SS cajas temporales
        const Hoja_RegCaja = SSvcajastemp.getSheetByName("Ldiario - caja")                              // S caja temporal
      
    //EN VENTA
        const SSventastemp = SpreadsheetApp.openById('1v01F1IIHPQoddE1CFhioDn7dNnhpCtXn4b0T0LRIPmY')  //SS ventas temporales
        const Hoja_Regventas = SSventastemp.getSheetByName("registro")                              // S venta temporal
   
    //EN SEÑA  
    const SSseñasreg = SpreadsheetApp.openById('19Pd-4YaGQ1KNCAVxgAHowuRK7Xm-zKr5GoYreToXJ1c')  //SS señas, modificable
      const Hoja_Regseñas = SSseñasreg.getSheetByName('Señas')
   
// VARIABLES QUE LEIAN DATOS DE PLANILLAS QUE AHORA SOLO SON DE ESCRITURA    
    const actualizar = 'Aqui se remitia a registro de salidas, renovar variable por LOOK?'
    const SSLook = 'ya la defino wachin'

//SS LECTURA DE DATOS

  var CodOrden = Utilities.formatDate(new Date(),'GMT-3',"MMdd").toLocaleString().concat(Hoja_RegCaja.getLastRow()).concat(Cdni.toString().slice(5,8)).concat(Ctipo.toString().slice(0,1)) //codigo generado

//---------------------------------------------------------------------
//---------------------------REGISTRO DE VENTA/SEÑA---------------------------
function cargaventa (){   
  const tarj_monto = Hoja_Caja1.getRange ('b35').getValue()
  const tarj_cuotas = Hoja_Caja1.getRange ('b36').getValue()

  /// CAMBIAR PARA QUE SIEMPRE SE COLOQUE UN SOLO PRECIO
verifCrearRem ()
//REGiSTRAR EN CAJA---
    var response = Ui.prompt("Escribi una referencia para CAJA").getResponseText()
      var pega_filacaja = [CodOrden, fechadeldia, Cncliente, Cdni,Ctel, totalremito, descuentoaplicado,response,totalrecibido,pefectivo, ptmp, ptbco, ptarjmp, potro, pnaranja, pUSD, pUSDT, ptemma,pnaremma, descuentoextra,tarj_monto,tarj_cuotas]

    Hoja_RegCaja.appendRow(pega_filacaja)

      let x = (1+( descuentoaplicado/(totalremito-descuentoaplicado)))
      let sumapvta = 0
      let cantproductos = Cproducto.length

    let  costo 
    let  producto 
    let cantidad
    let pvta
    let desproducto 
    let SKU
  
    let arregloarmados = [] //pc para armar

        let arregloproductos = [] //
        let esseña_
        let arregloseñapagos = []
        let ultimaf

  for (i in Cproducto){
    costo = Cproducto[i][0]
    producto = Cproducto[i][1]
    cantidad = Cproducto[i][2]
    pvta = Cproducto[i][3]
    esproducto = Cproducto[i][4]
    SKU = Cproducto[i][8]
           
      if (descuentoaplicado !== 0) { desproducto=0; pvta =  (pvta*x) }      
         
    sumapvta = (sumapvta+ pvta*cantidad)
        
      if (i==(cantproductos-1) && (sumapvta!=totalremito)){  pvta = (pvta + (totalremito-sumapvta)/cantidad) }
    
    arregloproductos.push([CodOrden,fechadeldia, producto,cantidad,pvta,desproducto, costo, Cncliente,"","","","","",SKU,timestamp])

       
  } //FIN DEL FORi de Cproductos


if (Ctipo=="Seña"){
            ultimaf = Hoja_Regseñas.getLastRow()+1
            arregloseñapagos.push(totalremito,totalrecibido,descuentoaplicado,Cdni,Ctel)   
            const datospegar = [arregloseñapagos]

    Hoja_Regseñas.getRange(ultimaf,1,arregloproductos.length,arregloproductos[0].length).setValues(arregloproductos)
    Hoja_Regseñas.getRange(ultimaf,9,1,5).setValues(datospegar)
     
      try { 
          Hpedidos.getRange(1, 1, 1, 9).copyTo(Hpedidos.getRange(parseInt(Hpedidos.getLastRow()) + 3, 1, 1, 9)) 
      } catch(e) {   // Si hay un error o la operación es cancelada, log o maneja el error aquí
            console.error("Error al actualizar pedidos: " + e.message);
      } finally {     actualizarPedidos();      }
    
} else { 

    ultimaf = Hoja_Regventas.getLastRow()+1
    Hoja_Regventas.getRange(ultimaf,1,arregloproductos.length,arregloproductos[0].length).setValues(arregloproductos)
}
SpreadsheetApp.flush()
Ui.alert("REGISTRADO!! :D")
}
//---------------------------------------------------------------------
//---------------------------VERIFICO CARGA VTA/SEÑA---------------------------
function verifico() {

  //Cprdcto : 0=costo, 1=id producto. 2= cant venta, 3= p venta, 4= p desc, 5=unid stock, 6=desc
Logger.log(Cproducto)

  //(Ctipo,Ui,Cncliente,Cdni,Cproducto,Cproducto,totalseñas,totalremito)

  if (modo == "MODO PEDIDOS"){Ui.alert("Para Ventas o Señas Usa el -Modo Venta-");return}
  if (Ctipo=="SSeña"){Ui.alert("Cambia el tipo a Venta o Seña");return}

  //------CHECKEO CLLIENTE, DNI, QUE HAYA PRDCT, QUE NO HAYA CANT SIN PRDCT------
  if (Cncliente==""){Ui.alert("Falta Nombre!NoVA");return}
  if (Cdni==""){Ui.alert("Falta DNI!NoVA");return}
  if (Cproducto.length==0){Ui.alert("No hay productos!NoVA");return}

  //------CHECKEO TEL EN SEÑAS Y TOTALES EN AMBOS------
  if (Ctipo=="Seña"){if (Ctel==""){Ui.alert("Falta n° telefono para SEÑA!! NoVa");return;}
  if (totalseñas != totalremito){Ui.alert("Las formas de pago no coinciden con monto de remito de seña! NoVA");return}}
  if (Ctipo=="Venta"){if (totalrecibido != totalremito){Ui.alert("Las formas de pago no coinciden con monto de remito! NoVA");return}}

  //------CHECKEAR DUPLICADOS------
  let productounico = []
    for (let i = 0; i<Cproducto.length;i++){
      if (productounico.includes(Cproducto[i][1])){
      Ui.alert('Hay productos duplicados!' +'   '+ Cproducto[i][1]);return
      }else{productounico.push(Cproducto[i][1])  }
    }  

    for(i in Cproducto){ 
        if (Cproducto[i][6]<Cproducto[i][2]){
        // if(Ctipo=="venta"){Ui.alert(' ==> '+Cproducto[i][1]+'<== NO ESTA NOOOO');return}
          let aa = Ui.alert(' ==> '+Cproducto[i][1]+'<== ESTA EN ENTRANTE, OK PARA CONTINUAR')
          if (aa=='CLOSE'){
            Ui.alert('OPERACION CANCELADA');
            return}
        }
     }  
 cargaventa()
}

