  const norden = Hoja_Caja1.getRange("b20").getValue()

  var pedidospend = Hoja_Regseñas.getRange(2, 1, Hoja_Regseñas.getLastRow(), 13).getValues()
  
  var traefecha = Hoja_Caja1.getRange("b25")

//---------------------------------------------------------------------
//---------------------------TRAER SEÑA----------------------------------
// ----------- TODOS LOS DATOS DE SEÑA SE TRAEN DESDE PESTAÑA SEÑAS! NO SE USA MAS CAJA
function traerSeña(){
  // LIMPIAR2()
  const SSlook = SpreadsheetApp.openById('16xkV-Y0yIV-3V07x7bvUPmbG3LwjdM0rteuV1WzYu1Q')
  const Sleercaja = SSlook.getSheetByName('cajas')//sin uso

  const Sleerseña = SSlook.getSheetByName('señas')

 var señado = Sleerseña.getRange(2,1,Sleerseña.getLastRow(),13).getValues()
 const buscarnorden = señado.filter(a=>a.includes(norden))
 const datosseña = buscarnorden[0]

  traecliente = Hoja_Caja1.getRange("b10").setValue(datosseña[7])
  traedni = Hoja_Caja1.getRange("b11").setValue(datosseña[11])
  traetel = Hoja_Caja1.getRange("b12").setValue(datosseña[12])
  traeseña = Hoja_Caja1.getRange("b27").setValue(datosseña[9])
  traefecha = Hoja_Caja1.getRange("b25").setValue(datosseña[1])
  descprevio=Hoja_Caja1.getRange("b30").setValue(datosseña[10])

  ////////////////////////////////////
/// El problema es que> lo pagado se trae desde la planilla temporal Señas-pedidos, sobre la cual no se estaba registrando la suma de lo señado
/// hay 2 soluciones, que se acumule en pedidos o que se acumule en caja. segun donde se acumule se tiene q traer el dato
/// en señado, como ya escribi, en la primera fila coincidente tomara lo q ya estaba pagado y le sumara el total recxibido
///               descentajas : propenso a q lo borren
/// en caja, luego de traer la seña, tomar el valor de b27 (monto de seña previo), y sumar este y totalremito, y colocarlo en señado en caja
///               desventaja : "que en el registro de caja, tendria el monto sumado y no lo que se entrego realmente, pero si estaria en forma de pago como efectivo o lo q sea"
///               desvcentaja 2 : Tendria que cambiar la forma de traer la seña, siendo que debera tomar los datos de el ultimo registro de ese norden desde reg de caja

  ////////////////////////////////////////

 var pedidospend2 = pedidospend.filter(a=>a[0]==norden)
   var ia = []

   for (let i = 0; i<pedidospend2.length;i++){
     let fila = pedidospend2[i].slice(2, 5);
    fila = fila.map(v => (typeof v === "string" ? v.trim() : v));
    ia.push(fila);
   }
    Hoja_Caja1.getRange(4,8,pedidospend2.length,3).setValues(ia)


 //var cajas = Sleercaja.getRange(2,1,Sleercaja.getLastRow(),9).getValues()
  //const lila = cajas.filter(a=>a.includes(norden))[cajas.filter(a=>a.includes(norden)).length-1]
 // var data2 = cajas.find(a=>a.includes(norden))

  

  }

//---------------------------------------------------------------------
//---------------------------VERIFICO TRAER SEÑA---------------------------
function calltraeseña (){

   if (modo != "MODO PEDIDOS"){Ui.alert("Para gestion de pedidos usa -MODO PEDIDOS- ");return}
  Hoja_Caja1.getRange("H4:k23").clearContent()
  pagos = Hoja_Caja1.getRange('E6:E15').clearContent()

  traerSeña()
}

function test (){
  
}

//---------------------------------------------------------------------
//---------------------------SALDAR SEÑA---------------------------
function SaldarSeña (){
   const tarj_monto = Hoja_Caja1.getRange ('b35').getValue()
  const tarj_cuotas = Hoja_Caja1.getRange ('b36').getValue()

  const hisorden = norden.concat("V")

if (descuentoaplicado!==0){
  var x = (1+( descuentoaplicado/(totalremito-descuentoaplicado)))
  }

      let sumapvta = 0
      let cantproductos = Cproducto.length

  //-----LLEVAR DE REGSEÑA A REGSALIDAS O VENTAS------

    for (i in pedidospend){
    
      if (pedidospend[i][0]==norden)
      { i++; i++;
        
      let borrar = Hoja_Regseñas.getRange(i,1,1,17).getValues()
      let pvta = borrar[0][4]
      let cantidad = borrar[0][3]

        borrar[0][0]=hisorden
        borrar[0][1]=fechadeldia

        if (descuentoaplicado !== 0) {
            pvta =  (pvta*x)
            //pvta = Math.round(temp/100)*100
            borrar[0][4] = pvta

        }
          sumapvta = (sumapvta+ pvta*cantidad)
          if (i==(cantproductos-1) && (sumapvta!=totalremito)){ 
           pvta = (pvta + (totalremito-sumapvta)/cantidad)
          }

     Hoja_Regventas.appendRow(borrar[0])
    Hoja_Regseñas.getRange(i,1,1,17).clear()
      } 
    }



  //------REGiSTRAR EN CAJA------
  var response = Ui.prompt("Escribi una referencia para CAJA").getResponseText()


 ////////


  var pega_filacaja = [hisorden, fechadeldia, Cncliente, Cdni,Ctel, totalremito,descuentoaplicado ,response,,pefectivo, ptmp, ptbco, ptarjmp, potro, pnaranja, pUSD, pUSDT,ptemma,pnaremma,descuentoextra,tarj_monto,tarj_cuotas] 
   Hoja_RegCaja.appendRow(pega_filacaja)
     verifCrearRem ()
  acomodarPedido()

  Ui.alert("REGISTRADO!! :D")
}

//---------------------------------------------------------------------
//---------------------------VERIFICO SALDAR SEÑA---------------------------
function verificoSSeña (){
  
  calltraeseña ()

  const traeseña2 = Hoja_Caja1.getRange("b27").getValue()


  if (Ctipo != "SSeña"){Ui.alert("Para Saldar Señas usa el Tipo SSeña!!");return}
  if (norden==""){Ui.alert("Ingresa un numero de Orden");return}
  if (totalrecibido != (totalremito-traeseña2)){Ui.alert("El pago no coincide con el saldo pendiente!");return}
  

  SaldarSeña()
 Hoja_Caja1.getRange("b27").clearContent()
   
}


