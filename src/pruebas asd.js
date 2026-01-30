function LIMPIAR_new(hoja,modo) {
  // ---- Limpieza de contenidos (1 sola operación)

  let sheet_limpiar = 'SHEETS.SOLUVENTAS.VENTA_B'

 if (hoja === "a") { sheet_limpiar = 'SHEETS.SOLUVENTAS.VENTAS' }

 let Hoja_Caja1  = getSheet('SS.SOLUVENTAS', sheet_limpiar); 

 let productos = 'H4:I23'
 if (modo === "seña") {productos = 'H4:O23'}

  Hoja_Caja1.getRangeList([
    'E6:E15',     // pagos
    'B10:B12',    // cliente
    productos,     // productos (input)
    'J5:O23',     // contenidos de cálculo
    'B27',        // seña
    'B30',        // desc seña
    'H36',        // descuento extra
    'H42:H47'  ,   // carga rápida
    'B35:B36'
  ]).clearContent();

  // ---- Estilos por bloques (muy pocas operaciones)
  Hoja_Caja1.getRangeList(['E6:E14','B10:B12','H4:I23'])
    .setFontFamily('Montserrat');

  Hoja_Caja1.getRangeList(['H4:I23'])
    .setFontSize(10)
    .setBackground('white');

  Hoja_Caja1.getRangeList(['B10:B12'])
    .setFontSize(12)
    .setBackground('white')
    .setVerticalAlignment('left');
}
function prueba33 (){
LIMPIAR_new("b","seña") }





function LIMPIAR() {
const Rpago = Hoja_Caja1.getRange('E6:E15')
const Rcliente = Hoja_Caja1.getRange('B10:B12')
const Rprdct=  Hoja_Caja1.getRange('H4:I23')
const Contenidos = Hoja_Caja1.getRange('j5:o23')
const Rseña= Hoja_Caja1.getRange('B27')
const Rdescseña= Hoja_Caja1.getRange('B30:B36')
const Rdesc= Hoja_Caja1.getRange('H36')
const RcargaP= Hoja_Caja1.getRange('H42:H47')

Rpago.clearContent()
Rcliente.clearContent()
Rprdct.clearContent()
Contenidos.clearContent()
Rseña.clearContent()
Rdesc.clearContent()
RcargaP.clearContent()
Rdescseña.clearContent()

Rpago.setFontFamily('Montserrat')

Rprdct.setFontFamily('Montserrat')
Rprdct.setFontSize('10')
Rprdct.setBackground('white')

Rcliente.setFontFamily('Montserrat')
Rcliente.setBackground('white')
Rcliente.setFontSize('12')
Rcliente.setVerticalAlignment("left")


}
function LIMPIAR2() {
//const Rpago = Hoja_Caja1.getRange('E6:E13')
const Rcliente = Hoja_Caja1.getRange('B10:B12')
const Rprdct=  Hoja_Caja1.getRange('H4:I23')
//const Rorden= Hoja_Caja1.getRange('B20:B21')
const Rseña= Hoja_Caja1.getRange('B27')
const Rdescseña= Hoja_Caja1.getRange('B30:B36')
const Rdesc= Hoja_Caja1.getRange('H36')
const RcargaP= Hoja_Caja1.getRange('H42:H47')

//Rpago.clearContent()
Rcliente.clearContent()
Rprdct.clearContent()
//Rorden.clearContent()
Rseña.clearContent()
Rdesc.clearContent()
RcargaP.clearContent()
Rdescseña.clearContent()

//Rpago.setFontFamily('Montserrat')

Rprdct.setFontFamily('Montserrat')
Rprdct.setFontSize('10')
Rprdct.setBackground('white')

Rcliente.setFontFamily('Montserrat')
Rcliente.setBackground('white')
Rcliente.setFontSize('12')
Rcliente.setVerticalAlignment("left")


}





function arrays (){



let datos = Hoja_RegCaja.getDataRange().getValues()


let asd = norden.slice(0,norden.toLocaleString().length-1).valueOf()

let x = datos.map(a=> a.indexOf(asd)).findIndex(b=>b!=-1)+1
let y = datos.map(a=> a.indexOf(asd)).filter(b=>b!=-1)
let z = datos.filter(a=>a[0].includes('s'))


Logger.log('Fila  ' + x + '  Columna  '+y)

Logger.log(z)
Logger.log(asd)

}