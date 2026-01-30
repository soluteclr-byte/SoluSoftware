//////////////////////////////////////////
// ADDSEÑA NUEVO
function addseña() {
   if (modo == "MODO VENTA/SEÑA"){Ui.alert("para agregar seña usa modo PEDIDOS");return}
/// PRIMERO TOMO DATOS DE PAGOS Y TOTALES
let formapago = Hoja_Caja1.getRange("E6:E16").getValues().flat()
      const pefectivo = formapago[0]
      const ptmp =  formapago[1]
      const ptbco =  formapago[2]
      const ptarjmp =  formapago[3]
      const potro =  formapago[4]
      const pnaranja = formapago[5]
      const pUSD =  formapago[6]
      const pUSDT = formapago[7]
      const ptemma =  formapago[8]
      const pnaremma =  formapago[9]
  let totalrecibido = formapago[10]

   const tarj_monto = Hoja_Caja1.getRange ('b35').getValue()
  const tarj_cuotas = Hoja_Caja1.getRange ('b36').getValue()

const descuentoaplicado = parseInt(Hoja_Caja1.getRange('J25').getValue()) //lo saco en el momento de ingreso del pago
const descuentoextra =Hoja_Caja1.getRange("H36").getValue() // se podra aplicar recargos/descuentos durante el addseña
///Verificacion
if (totalrecibido < 1){Ui.alert('No hay pago ingresado!!');return}
 let confirmar = Ui.prompt("Estas agregando -->   "+"$"+totalrecibido+"" +" al pedido--> "+norden+"  escribi >si< para confirmar").getResponseText()
   if (confirmar!="si"){Ui.alert("No se agrego el producto");return}

// TRAIGO SEÑA PARA ASEGURARME DATOS DE PRODUCTOS
calltraeseña ()

let totalremito = Hoja_Caja1.getRange("J27").getValue() //TOTAL REMITO

  const variacionproductos = (1+(descuentoaplicado/totalremito))

let datoscliente = Hoja_Caja1.getRange('b10:b12').getValues().flat()
    const Cncliente = datoscliente[0]
    const Cdni = datoscliente[1]
    const Ctel = datoscliente[2]

 let response = Ui.prompt("Escribi una referencia para CAJA").getResponseText()

  let filaregistro = [norden,fechadeldia,Cncliente+' +',Cdni,Ctel,(totalremito+descuentoaplicado),descuentoaplicado,response,totalrecibido,pefectivo,ptmp,ptbco,ptarjmp,potro,pnaranja,pUSD,pUSDT,ptemma,pnaremma,descuentoextra,tarj_monto,tarj_cuotas]

Hoja_RegCaja.appendRow(filaregistro)
Logger.log(totalremito+descuentoaplicado)
  
  ////MODIFICAR RECIBIDO Y DESCUENTO EN SEÑAS!///////
  const rango = Hoja_Regseñas.getRange(1,1,Hoja_Regseñas.getLastRow(),11)
  const dataseñas = rango.getValues()

let isFirstMatch = true;
dataseñas.forEach((fila,i)=>{
    if (fila[0]===norden){  
      dataseñas[i][4]=dataseñas[i][4]*variacionproductos;
      if (isFirstMatch){
        fila[9]+=totalrecibido;
        isFirstMatch = false;
      }
    }
}) 

rango.setValues(dataseñas)

SpreadsheetApp.getUi().alert("Se agregaron "+totalrecibido+" al pedido")
}
                                                                             
//----------------------------------------------------------------------------------------------------------------
//---------------------------Agregar nuevo producto al pedido---------------------------
function addPrducto(datoz){  

    for (a in Cproducto){
      Hoja_Regseñas.appendRow([norden,fechadeldia,Cproducto[a][1],Cproducto[a][2],Cproducto[a][3],Cproducto[a][4],Cproducto[a][0],datoz[7],,,,,,Cproducto[i][8],timestamp,,fechadeldia])
          
          
     }     
let f = 0
    
const datop = datoz
 
 const cantPrdtReg = datop.length
 Logger.log(datop.length)

 const cantPrdtCarga = Cproducto.length

  Logger.log(cantPrdtReg+cantPrdtCarga)

   if (cantPrdtReg > 3) {
    f = cantPrdtCarga;
  } else if (cantPrdtReg < 3 && cantPrdtReg + cantPrdtCarga > 3) {
    f = cantPrdtReg + cantPrdtCarga - 3;
  }  
   if (f !== undefined && f!==0) {
    agregarprctPedidos(f);
  }
  Logger.log(f)


  actualizarPedidos()
  }

//----------------------------------------------------------------------------------------------------------------
//-----------------------------modificacion en hoja pedidos-----------------------------------------------
function agregarprctPedidos(filas) {

  const ubicopedido = Hpedidos.getRange(6,1,Hpedidos.getLastRow(),1).getValues() 
  const fila = ubicopedido.findIndex(a=>a.includes(norden))

  Logger.log("fila " +fila)
  
    for (i = 0; i < filas; i++) {
      Hpedidos.insertRowAfter(parseInt(fila+8))
     
    }
     Ui.alert(ubicopedido[i]+"   ----> AGREGADO A PEDIDOS!!")
}
//----------------------------------------------------------------------------------------------------------------
function checkaddPrdct(){

   if (modo!="MODO VENTA/SEÑA"){Ui.alert("Para agregar un producto a un pedido usa el MODO VENTAS");return}
   if (Ctipo!="Seña"){Ui.alert("Para agregar un producto a un pedido usa el tipo Seña");return}
      if (Cproducto==""){Ui.alert("NO HAY PRODUCTOS");return}
  //------CHECKEAR DUPLICADOS------
  let productounico = []
    for (let i = 0; i<Cproducto.length;i++){

      if (productounico.includes(Cproducto[i][1])){
      Ui.alert('Hay productos duplicados!' +'   '+ Cproducto[i][1]);return
      }else{productounico.push(Cproducto[i][1])  }
    }  
  //------CHECKEO SI HAY STOCK + CHECKEO SI EL PRODCT YA ESTA EN EL PEDIDO--------
   var datoz = pedidospend.filter(a=>a.includes(norden))
  
    for (i in Cproducto){
       if (Cproducto[i][7]<Cproducto[i][2]){const prdct=Cproducto[i][1];
        const aa = Ui.alert(' ==> '+prdct+'<== ESTA EN ENTRANTE, OK PARA CONTINUAR')
        if (aa=='CLOSE'){
          Ui.alert('OPERACION CANCELADA');
          return}}
     const x = Cproducto[i][1]
       if (datoz.find(a=>a.includes(x))){
          Ui.alert(x+" "+ 'ya esta en el pedido, usa Elimn productos para agregar cantidad');return }
    }  
  const confirmar = Ui.prompt("Estas agregando producto/s al pedido   "+""+norden+"" +"  Para confirmar escribi -si-").getResponseText()
  if (confirmar!="si"){Ui.alert("No se agrego el producto");return}

addPrducto(datoz)
}

//----------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------
function lanzarquitar (){
if(modo!="MODO PEDIDOS"){Ui.alert("Para agregar seña, usa el modo Pedidos!");return}
if(Ctipo!="Seña"){Ui.alert("Para agregar seña, usa el tipo Seña!");return}
Ui.alert("EN CASO DE AGREGAR CANTIDADES, CHECKEAR MANUALMENTE QUE ESTEN DISPONIBLES!!!!")

quitarProducto()
}

//---------------------------------------------------------------------
//---------------------------QUITAR PRODUCTO DE SEÑA---------------------------
function quitarProducto() {
 const Cproducto = Hoja_Caja1.getRange("H4:I23").getValues().filter( elemento =>   elemento[0] !="")//saco las filas en blanco

  for (i in pedidospend){
    if (pedidospend[i].includes(norden)){
      for (a in Cproducto){
        
        if (pedidospend[i][2]==Cproducto[a][0]){ 
          if (pedidospend[i][3]!=Cproducto[a][1]){ 

                r = parseInt(i)+2               
            Hoja_Regseñas.getRange(r,4).setValue(Cproducto[a][1])
            Hoja_Regseñas.getRange(r,12).setValue(fechadeldia)
  
          }
        }
      }
    }  
  }

actualizarPedidos()
 Ui.alert("Se modifico la cantidad del producto")
 //refreshlista ()
}

