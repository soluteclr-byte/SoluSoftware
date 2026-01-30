
  const activaPedidos = SpreadsheetApp.openById('1K2WL7sFeywuVEULqkn6DJOXGxkUYF67zad6GZd8SKQg')
   

  const Hpedidos = activaPedidos.getSheetByName('Pedidos')
  

function acomodarPedido() {
  const tomoHpedidos = Hpedidos.getRange(6,1,Hpedidos.getLastRow()-1,1).getValues()

    
    for (e in tomoHpedidos){ 
      if (tomoHpedidos[e].includes(norden)){

        let filasaborrar = Cproducto.length
        if (filasaborrar <3){filasaborrar=3}

        Hpedidos.deleteRows(parseInt(e)+4,parseInt(filasaborrar)+3)

        Logger.log(parseInt(filasaborrar))
      }      
  }
  Ui.alert("SACADO DE PEDIDOS")
}

//----------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------
function actualizarPedidos() {
   ////////////////RESPALDO DE ANOTACIONES ////////////////////////////////////////  
  const Hrespaldo = activaPedidos.getSheetByName('respaldo');  Hrespaldo.clear();
  const respaldo = Hrespaldo.getRange (1,1,parseInt(Hrespaldo.getLastRow())+1,5)
  Hpedidos.getRange(6,7,Hpedidos.getLastRow()+2,3).copyTo(respaldo)
    Hpedidos.getRange('A6:l800').clearContent()
   ////////////////SETEO//////////////////////////////////////////////

  Hpedidos.getRange('A6:l600').setBackground("white")

//////////////TOMO LOS DATOS DESDE SEÑAS/////////

      let pedidospend = Hoja_Regseñas.getRange(2, 1, Hoja_Regseñas.getLastRow(), 13).getValues()//LA VUELVO A TOMAR PARA Q TENGA DATOS "NUEVOS"
     // const Ordenes = Hoja_Regseñas.getRange('S:S').getValues().filter( a=>a[0] !="")// ORDENES DE "SEÑAS"//
     const values = Hoja_Regseñas.getRange('A2:A').getValues().flat().filter(String);
const Ordenes = [...new Set(values)];

     
///////PASO POR TODAS LAS ORDENES////////
  for (i in Ordenes){
      const ultimaf = Hpedidos.getLastRow();  var l = parseInt(ultimaf) //me ubico en "pedidos", aca trabajo
      Hpedidos.getRange(1,1,1,9).copyTo(Hpedidos.getRange(parseInt(ultimaf)+3,1,1,9))///pegar Encabezado que divide los "pedidos"
  
    const rotarseñas = pedidospend.filter(a=>a[0].includes(Ordenes[i]))
        Hpedidos.getRange(ultimaf+5,1).setValue(Ordenes[i]) //pegar Norden
        Hpedidos.getRange(parseInt(ultimaf)+4,2).setValue(rotarseñas[0][7]);             //NOMBRE *****ACA PROBLEMA
        Hpedidos.getRange(parseInt(ultimaf)+5,2).setValue(rotarseñas[0][12]);            //Telefono
        Hpedidos.getRange(parseInt(ultimaf)+6,2).setValue(rotarseñas[0][8]);             //TOTAL
        Hpedidos.getRange(parseInt(ultimaf)+4,5).setValue(rotarseñas[0][9]);             //seña
        Hpedidos.getRange(parseInt(ultimaf)+4,6).setValue(rotarseñas[0][1]);             //fecha
  ///////////////////////////////////////////////////////////////////////////
  ////////BUSCO LOS PRODUCTOS DE CADA ORDEN/////////////

      for (e in pedidospend){
        
        if (pedidospend[e][0].includes(Ordenes[i])){
        //prdct
          Hpedidos.getRange(l+4,3).setValue(pedidospend[e][2]);//PRODUCTO
          Hpedidos.getRange(l+4,4).setValue(pedidospend[e][3]);//UNID
          l++
        }
      }
  }
  Hrespaldo.getRange (1,1,parseInt(Hrespaldo.getLastRow())+4,5).copyTo(Hpedidos.getRange(6,7))
}


















