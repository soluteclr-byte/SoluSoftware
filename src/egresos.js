
function r_egresos() {
  const h_egresos = SSvcajastemp.getSheetByName('egresos');
  const Hoja_regegreso = activa.getSheetByName('Retiros de caja');

  let monto = Hoja_regegreso.getRange('C9').getValue();
  let tipoegreso = Hoja_regegreso.getRange('C12').getValue();
  let detalle = Hoja_regegreso.getRange('C15').getValue();

  // Verificación de campos obligatorios
  if (monto === "" || tipoegreso === "" || (tipoegreso.includes("detallar") && detalle === "")) {
    Ui.alert("COMPLETA TODO!");
    return;
  }

  let filaegreso = [detalle, tipoegreso, monto, fechadeldia];
  h_egresos.appendRow(filaegreso);

  // Mostrar mensaje de confirmación
  var htmlOutput = HtmlService.createHtmlOutput('<p>Registrado OK!</p>')
    .setWidth(300)
    .setHeight(200);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Procesando...');

  // Limpieza de campos
  Hoja_regegreso.getRange('C9:C15').clearContent();
}

















