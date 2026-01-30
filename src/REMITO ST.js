function crearremitoST(ss,sheet,data,nordenst) {
 
// PREPARO DATOS PARA ARMAR REMITO
const cliente = data.cliente[0]
const dni = data.cliente[1]
const tel = data.cliente[2]
const fechadeldia = Utilities.formatDate (new Date(), 'GMT-3', "dd/MM/yyyy")

  let accesorios = data.equipo[2] !== "" ? " ademas de accesorios > " : " sin accesorios ";

const datos1 = [["El dia "+fechadeldia+" se recibe del cliente dni: "+dni+" y telefono "+tel],
                ["Una "+data.equipo[0]+" "+data.equipo[1]+accesorios+data.equipo[2]]]

const datos2 = [[data.equipo[3]+" /"+ data.equipo[4]+" /"+  data.equipo[5]+" /"+  data.equipo[6]+" /"+  data.equipo[7]],
                        ["el equipo "+ data.infoimportante[1]],
                        [data.infoFalla[0]],
                        [data.infoFalla[1]],
                        [data.infoFalla[2]],
                        [data.infoFalla[3]],
                        [data.infoFalla[4]],
                        [data.infoObservasiones[0]],
                        [data.infoObservasiones[1]],
                        [data.infoObservasiones[2]],
                        [data.infoObservasiones[3]],
                        [data.infoObservasiones[4]]]

//CREO REMITO
    ss.setActiveSheet(sheet)
    let nuevoRemST = ss.duplicateActiveSheet() //duplica la plantilla
    const newName = cliente+" ST " //nombre de la hoja
   let finalName = getUniqueSheetName(ss, newName); // por si hay un nombre igual, le pone contador
  nuevoRemST.setName(finalName)//pone el nombre del remito
  nuevoRemST = ss.getSheetByName(finalName)

//Preparo el remito con los datos
const rangocliente1 = nuevoRemST.getRange("C3")
const rangocliente2 = nuevoRemST.getRange("C23")
const rangodato11 = nuevoRemST.getRange("B4:b5")
const rangodato12 = nuevoRemST.getRange("B24:b25")
const rangodato21 = nuevoRemST.getRange("c7:c18")
const rangodato22 = nuevoRemST.getRange("C27:C38")

rangocliente1.setValue(cliente)
rangocliente2.setValue(cliente)
rangodato11.setValues(datos1)
rangodato12.setValues(datos1)
rangodato21.setValues(datos2)
rangodato22.setValues(datos2)
}

function getUniqueSheetName(ss, baseName) {
  let counter = 0;
  let uniqueName = baseName;
  const sheets = ss.getSheets();

  // Continuar incrementando el contador hasta encontrar un nombre que no exista
  while (sheetNameExists(ss, uniqueName)) {
    counter++;
    uniqueName = baseName + counter;
  }

  return uniqueName;
}

// Función para verificar si un nombre de hoja ya existe
function sheetNameExists(ss, sheetName) {
  return ss.getSheets().some(sheet => sheet.getName() === sheetName);
}

