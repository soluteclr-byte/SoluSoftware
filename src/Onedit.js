function onEdit(e) {
  var range = e.range;
  let sheet = e.source.getActiveSheet();
  let sheetName = sheet.getName();

  // Lista de hojas válidas para la operación onEdit
  const validSheetNames = ["Ventas", "Venta (b)"];

    // Comprobar si la hoja actual está en la lista de hojas válidas
  if (validSheetNames.includes(sheetName) && range.getColumn() === 8 && range.getRow() >= 4 && range.getRow() <= 23) {
 
    // Obtiene el rango completo B10:B27
    const fullRange = sheet.getRange("H4:H23");

     // Aplica el formato deseado a la fuente
    fullRange.setFontFamily('Montserrat');
    fullRange.setFontSize(10);
    fullRange.setHorizontalAlignment("left");
    fullRange.setVerticalAlignment("middle");

    // Elimina todos los bordes existentes en el rango B10:B27
    //fullRange.setBorder(false, false, false, false, false, false);

    // Aplica bordes delgados negros en los lados superior, izquierdo e inferior del rango B10:B27
    //fullRange.setBorder(true, true, true, false, false, false, "#000000", SpreadsheetApp.BorderStyle.SOLID);

     // Reaplica la validación de datos al rango
  const listaValidacion = activa.getSheetByName("LISTA")

  let validationRange = listaValidacion.getRange('D5:D2800');

  const validationRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(validationRange, true) // true -> mostrar lista desplegable
    .setHelpText("Producto")
    .setAllowInvalid(false)
    .build();

  range.setDataValidation(validationRule);
  }
}

function pruebaedit (){

  const rangoProductos = Hoja_Caja1.getRange("h4:h23")

     rangoProductos.setFontFamily('Montserrat');
    rangoProductos.setFontSize(10);
    rangoProductos.setHorizontalAlignment("left");
    rangoProductos.setVerticalAlignment("middle");

const listaValidacion = activa.getSheetByName("LISTA")
  var validationRange = listaValidacion.getRange('D:D');
  var validationRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(validationRange, true)
    .setHelpText('Producto')
    .setAllowInvalid(false)
    .build();

  rangoProductos.setDataValidation(validationRule);

}