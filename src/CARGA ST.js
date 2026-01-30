function lanzamientoprueba(){
     Logger.log("lanzado start")

  const ssSoluventas = "1igpQJ48glztoNn9kUc2BMb9X-7uI_RNBSVJfChEk37c"
  const sheetCargaST = "ST"
  const SheetST = SpreadsheetApp.openById(ssSoluventas).getSheetByName(sheetCargaST)
  const rango = "C3:H31"
 
  const data = tomarData(SheetST,rango)

  const ssPedidos = "1K2WL7sFeywuVEULqkn6DJOXGxkUYF67zad6GZd8SKQg"
  const sheetRegistroST = "Servicio Tecnico Actual"
  const SheetRegST = SpreadsheetApp.openById(ssPedidos).getSheetByName(sheetRegistroST)

  const ssRemitos = "1FDkz2XT6JnUqSdnmbWo8JAokGgYI4eWPVnNP8A_zLKU"
    const ssRem = SpreadsheetApp.openById(ssRemitos)
  const sheetremST = "S Tecnico"
    const SheetRemST = ssRem.getSheetByName(sheetremST)

  const nordenst = nOrdenST(data)

  registrarST(SheetRegST,data,nordenst)

  crearremitoST(ssRem,SheetRemST,data,nordenst)

  SheetST.getRange("C3:e9").clearContent()
  SheetST.getRange("C12:e20").clearContent()
  SheetST.getRange("g4:g8").clearContent()
  SheetST.getRange("g11:g15").clearContent()
  SheetST.getRange("g18:g22").clearContent()
  SheetST.getRange("C23:C26").setValue("FALSE")

  //SpreadsheetApp.flush()
  Ui.alert("REGISTRADO!!!")
      Logger.log("lanzado end")
}

function tomarData(sheet,rango) {
   Logger.log("tomo datos start")

  const datos = sheet.getRange(rango).getValues()
  const basicData = {
    Asesor : datos[0][0],
    Tipo : datos[2][0],
              //nombre , dni ,tel
    cliente: [datos[4][0],datos[5][0],datos[6][0]],
              //0 tipo,1 marca/modelo/color, 2 accesorios - 3 proce,4 ram,5 disco,6 p video,7 fuente
    equipo : [datos[9][0],datos[10][0],datos[11][0],datos[13][0],datos[14][0],datos[15][0],datos[16][0],datos[17][0]],
    infoimportante: [datos[20][1]+" solu",datos[21][1]+" enciende",datos[22][1]+" formateo",datos[23][1]+" backup"],

    infoFalla: [datos[1][4],datos[2][4],datos[3][4],datos[4][4],datos[5][4]],
    infoObservasiones: [datos[8][4],datos[9][4],datos[10][4],datos[11][4],datos[12][4]],
    infoProductos: [datos[15][4],datos[16][4],datos[17][4],datos[18][4],datos[19][4]]
  };
  ("tomo datos end")
  return basicData;
}

function nOrdenST (data){ Logger.log("norden start")
  //Logger.log(data.cliente[1])

    const fechadeldia = Utilities.formatDate (new Date(), 'GMT-3', "ddMM")
    const cliente = data.cliente[0].toString().slice(0,2)
    const dni = data.cliente[1].toString().slice(-3)

    let nOrdenst = fechadeldia.concat(cliente).concat(dni).concat("T")
 Logger.log("norden end")
  return(nOrdenst)
  
}

function registrarST (sheet,data, nOrdenst){

  Logger.log("registro start")
   const fechadeldia = Utilities.formatDate (new Date(), 'GMT-3', "dd/MM/YY")

  let arrayRegistro = [];


    fila1 = ["ingresado","sin asignar","Asesor: "+data.Asesor,data.Tipo + " - " +fechadeldia,"Descripción", "Observaciones", "Diagnóstico técnico", "productos-servicios"]
  fila2 = ["","",data.cliente[0],data.equipo[0]+" "+data.equipo[1],data.infoFalla[0],data.infoObservasiones[0],"",data.infoProductos[0]]
  fila3= ["","",data.cliente[1],data.equipo[2],data.infoFalla[1],data.infoObservasiones[1],"",data.infoProductos[1]]
  fila4= ["","",data.cliente[2],data.equipo[3]+" / "+data.equipo[4]+" / "+data.equipo[5]+" / "+data.equipo[6]+" / "+data.equipo[7],data.infoFalla[2],data.infoObservasiones[2],"",data.infoProductos[2]]
  fila5= ["","",nOrdenst             ,data.infoimportante[0]+" - "+data.infoimportante[1],data.infoFalla[3],data.infoObservasiones[3],"",data.infoProductos[3]]
  fila6= ["","", "Avisos"              ,data.infoimportante[2]+" - "+data.infoimportante[3],data.infoFalla[4],data.infoObservasiones[4],"",data.infoProductos[4]]
  arrayRegistro.push(fila1,fila2,fila3,fila4,fila5,fila6)

  //Logger.log(arrayRegistro)
  let ultimaF = sheet.getLastRow()+2
  formatCells(sheet,ultimaF)

  let rango = sheet.getRange(ultimaF,1,6,8)
  let rangoformato1 = sheet.getRange(ultimaF,1,7,8)
  let rangoformato2 = sheet.getRange(ultimaF,1,1,8)
Logger.log("arrayRegistro")
  rango.setValues(arrayRegistro)
  rangoformato1.setBorder(true, false, true, false, false, false); // Bordes en todos los lados
  rangoformato2.setBackground("grey")
  rangoformato2.setFontWeight("bold")
  Logger.log("registro end")
}

function formatCells(sheet,y) {
  Logger.log("formato celdas start")
  // Definir el rango de celdas
  let rAsignacion = sheet.getRange(y,2,7);
  let rDato = sheet.getRange(y,1,7);
  
  rAsignacion.merge();  // Unir las celdas
  rDato.merge()
  // Centrar el texto horizontal y verticalmente
  rAsignacion.setHorizontalAlignment('center'); 
  rAsignacion.setVerticalAlignment('middle');
  rDato.setHorizontalAlignment('center'); 
  rDato.setVerticalAlignment('middle');
  rDato.setTextRotation(45)
  rAsignacion.setFontWeight('bold');// Poner el texto en negrita
  rDato.setFontWeight('bold');// Poner el texto en negrita
  Logger.log("formato celdas end")
}
