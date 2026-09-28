const ADMIN_PASSWORD = "AdminAleks2026"; 

function doGet(e) {
  var page = e.parameter.p;
  if (page === 'alumno') {
    return HtmlService.createTemplateFromFile('alumno')
        .evaluate()
        .setTitle('Consulta de Licencia ALEKS - Alumnos')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  return HtmlService.createTemplateFromFile('login')
      .evaluate()
      .setTitle('Acceso Administrador - Licencias ALEKS')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function validarPasswordAdmin(pass) {
  if (pass === ADMIN_PASSWORD) {
    var template = HtmlService.createTemplateFromFile('admin');
    return { exito: true, html: template.evaluate().getContent() };
  } else {
    return { exito: false, mensaje: 'Contraseña incorrecta.' };
  }
}

// FUNCION AUXILIAR: FORMATEAR FECHA A dd/MMM/yyyy (ej. 28/sep/2026)
function formatearFechaLarga(fechaObj) {
  if (!fechaObj || isNaN(new Date(fechaObj).getTime())) return '';
  var d = new Date(fechaObj);
  var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  
  var dd = String(d.getDate()).padStart(2, '0');
  var mmm = meses[d.getMonth()];
  var yyyy = d.getFullYear();
  
  return dd + '/' + mmm + '/' + yyyy;
}

// FUNCION AUXILIAR: CALCULAR FECHA DE VENCIMIENTO AUTOMÁTICA
function calcularFechaVencimientoObj(fechaPagoStr, vigencia) {
  var partes = fechaPagoStr.split('-');
  var fecha = new Date(partes[0], partes[1] - 1, partes[2]);

  if (vigencia === '1 Año') {
    fecha.setFullYear(fecha.getFullYear() + 1);
  } else if (vigencia === '4 Meses') {
    fecha.setMonth(fecha.getMonth() + 4);
  } else if (vigencia === '2 Meses') {
    fecha.setMonth(fecha.getMonth() + 2);
  }

  return fecha;
}

// 1. BÚSQUEDA PARA ADMINISTRADOR
function buscarAlumnoAdmin(hora, salon, matricula) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetAlumnos = ss.getSheetByName('ListadoAlumnos');
  var data = sheetAlumnos.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    var rHora = String(data[i][0]).trim();
    var rSalon = String(data[i][1]).trim();
    var rMatricula = String(data[i][4]).trim();
    
    if (rHora === String(hora).trim() && rSalon === String(salon).trim() && rMatricula === String(matricula).trim()) {
      return {
        exito: true,
        filaIndex: i + 1,
        materia: data[i][2],
        nombreAlumno: data[i][5],
        correoAlumno: data[i][6],
        licenciaAleks: data[i][7] || '',
        nivel: data[i][8] || '',
        vigencia: data[i][9] || '',
        fechaPagoInput: data[i][10] ? Utilities.formatDate(new Date(data[i][10]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
        fechaPago: data[i][10] ? formatearFechaLarga(data[i][10]) : '',
        fechaVencimiento: data[i][11] ? formatearFechaLarga(data[i][11]) : '',
        cajera: data[i][12] || '',
        folioRecibo: data[i][13] || ''
      };
    }
  }
  return { exito: false, mensaje: 'No se encontró el alumno con la Hora, Salón y Matrícula ingresados.' };
}

// 2. REGISTRO DE PAGO Y ASIGNACIÓN AUTOMÁTICA DE LICENCIA
function registrarPagoYEnviarCorreo(datos) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAlumnos = ss.getSheetByName('ListadoAlumnos');
    var sheetLicencias = ss.getSheetByName('LicenciasAleks');
    
    var filaAlumno = parseInt(datos.filaIndex);
    var matricula = String(sheetAlumnos.getRange(filaAlumno, 5).getValue()).trim();
    var codigoLicenciaAsignada = datos.licenciaAleks;

    // Asignación desde inventario si no tiene licencia
    if (!codigoLicenciaAsignada) {
      var dataLicencias = sheetLicencias.getDataRange().getValues();
      var filaLicenciaEncontrada = -1;

      var nivelBuscado = String(datos.nivel).trim().toLowerCase();
      var vigenciaBuscada = String(datos.vigencia).trim().toLowerCase();

      for (var j = 1; j < dataLicencias.length; j++) {
        var rNivel = String(dataLicencias[j][1]).trim().toLowerCase();
        var rVigencia = String(dataLicencias[j][2]).trim().toLowerCase();
        var rEstatus = String(dataLicencias[j][3]).trim().toLowerCase();

        if (rNivel === nivelBuscado && rVigencia === vigenciaBuscada && rEstatus === 'disponible') {
          codigoLicenciaAsignada = dataLicencias[j][0];
          filaLicenciaEncontrada = j + 1;
          break;
        }
      }

      if (filaLicenciaEncontrada === -1) {
        return { 
          exito: false, 
          mensaje: '❌ No hay licencias disponibles en inventario para ' + datos.nivel + ' (' + datos.vigencia + '). Favor de recargar el stock en LicenciasAleks.' 
        };
      }

      sheetLicencias.getRange(filaLicenciaEncontrada, 4).setValue('Asignada');
      sheetLicencias.getRange(filaLicenciaEncontrada, 5).setValue(matricula);
    }

    // Calcular Fechas en Formato Obj y Formato dd/MMM/yyyy
    var partesPago = datos.fechaPago.split('-');
    var fechaPagoObj = new Date(partesPago[0], partesPago[1] - 1, partesPago[2]);
    var fechaVencimientoObj = calcularFechaVencimientoObj(datos.fechaPago, datos.vigencia);

    var fechaPagoFormateada = formatearFechaLarga(fechaPagoObj);
    var fechaVencimientoFormateada = formatearFechaLarga(fechaVencimientoObj);

    // Guardar en ListadoAlumnos (formato legible dd/MMM/yyyy)
    sheetAlumnos.getRange(filaAlumno, 8).setValue(codigoLicenciaAsignada); 
    sheetAlumnos.getRange(filaAlumno, 9).setValue(datos.nivel);            
    sheetAlumnos.getRange(filaAlumno, 10).setValue(datos.vigencia);         
    sheetAlumnos.getRange(filaAlumno, 11).setValue(fechaPagoFormateada);       
    sheetAlumnos.getRange(filaAlumno, 12).setValue(fechaVencimientoFormateada);
    sheetAlumnos.getRange(filaAlumno, 13).setValue(datos.cajera);          
    sheetAlumnos.getRange(filaAlumno, 14).setValue(datos.folioRecibo);      
    sheetAlumnos.getRange(filaAlumno, 15).setValue('Enviado');             

    // Correo Electrónico
    var asunto = "Tu Licencia ALEKS - " + datos.nivel + " (" + datos.vigencia + ")";
    var cuerpo = "Hola " + datos.nombreAlumno + ",\n\n" +
                 "Se ha registrado tu pago exitosamente.\n\n" +
                 "Detalles de tu Licencia ALEKS:\n" +
                 "- Nivel: " + datos.nivel + "\n" +
                 "- Vigencia: " + datos.vigencia + "\n" +
                 "- Fecha de Activación/Pago: " + fechaPagoFormateada + "\n" +
                 "- Fecha Tentativa de Vencimiento: " + fechaVencimientoFormateada + "\n" +
                 "- Materia: " + datos.materia + "\n" +
                 "- Código de Licencia: " + codigoLicenciaAsignada + "\n" +
                 "- Folio de Recibo: " + datos.folioRecibo + "\n\n" +
                 "Por favor ingresa a la plataforma ALEKS con el código proporcionado antes de tu fecha de vencimiento.";

    MailApp.sendEmail(datos.correoAlumno, asunto, cuerpo);

    return { 
      exito: true, 
      mensaje: '¡Éxito! Licencia [' + codigoLicenciaAsignada + '] asignada. Vence el: ' + fechaVencimientoFormateada 
    };

  } catch(e) {
    return { exito: false, mensaje: 'Error en el proceso: ' + e.toString() };
  }
}

// 3. BÚSQUEDA PARA ALUMNO (Solo Matrícula)
function buscarAlumnoVista(matricula) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetAlumnos = ss.getSheetByName('ListadoAlumnos');
  var data = sheetAlumnos.getDataRange().getValues();
  
  var matriculaLimpia = String(matricula).trim().toLowerCase();
  
  if (!matriculaLimpia) {
    return { exito: false, mensaje: 'Por favor ingresa tu matrícula.' };
  }

  for (var i = 1; i < data.length; i++) {
    var rMatricula = String(data[i][4]).trim().toLowerCase();
    
    if (rMatricula === matriculaLimpia) {
      var licencia = data[i][7];
      
      if (!licencia) {
        return { 
          exito: false, 
          mensaje: 'Tu matrícula (' + data[i][4] + ') fue encontrada, pero aún no tienes una licencia asignada. Favor de acudir a Cajas a realizar tu pago.' 
        };
      }

      var fechaVenc = data[i][11];
      var fechaVencFormateada = (fechaVenc instanceof Date) ? formatearFechaLarga(fechaVenc) : String(fechaVenc);
      
      return {
        exito: true,
        nombreAlumno: data[i][5],
        materia: data[i][2],
        nombreMaestro: data[i][3],
        licenciaAleks: licencia,
        nivel: data[i][8] || 'N/A',
        vigencia: data[i][9] || 'N/A',
        fechaVencimiento: fechaVencFormateada || 'N/A'
      };
    }
  }
  
  return { exito: false, mensaje: 'No se encontró ninguna matrícula registrada que coincida con "' + matricula + '". Revisa tus datos o consulta en Administración.' };
}