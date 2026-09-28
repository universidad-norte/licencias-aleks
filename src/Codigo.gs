// ==========================================
// CONFIGURACIÓN DE SEGURIDAD
// ==========================================
const ADMIN_PASSWORD = "AdminAleks2026"; // <-- Cambia la contraseña aquí

function doGet(e) {
  var page = e.parameter.p;
  
  // RUTA VISTA ALUMNO (Pública)
  if (page === 'alumno') {
    return HtmlService.createTemplateFromFile('alumno')
        .evaluate()
        .setTitle('Consulta de Licencia ALEKS - Alumnos')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  // RUTA VISTA ADMIN (Por defecto abre el login de admin)
  return HtmlService.createTemplateFromFile('login')
      .evaluate()
      .setTitle('Acceso Administrador - Licencias ALEKS')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// FUNCIONES DE SERVIDOR

// 1. Validar Contraseña de Admin
function validarPasswordAdmin(pass) {
  if (pass === ADMIN_PASSWORD) {
    var template = HtmlService.createTemplateFromFile('admin');
    return { exito: true, html: template.evaluate().getContent() };
  } else {
    return { exito: false, mensaje: 'Contraseña incorrecta. Intente nuevamente.' };
  }
}

// 2. Búsqueda para Administrador
function buscarAlumnoAdmin(hora, salon, matricula) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
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
        licenciaAleks: data[i][7],
        fechaPago: data[i][8] ? new Date(data[i][8]).toISOString().split('T')[0] : '',
        cajera: data[i][9] || '',
        folioRecibo: data[i][10] || ''
      };
    }
  }
  return { exito: false, mensaje: 'No se encontró ningún registro que coincida con la Hora, Salón y Matrícula.' };
}

// 3. Registrar Pago y Enviar Correo
function registrarPagoYEnviarCorreo(datos) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var fila = parseInt(datos.filaIndex);
    
    sheet.getRange(fila, 9).setValue(datos.fechaPago);   // fecha_pago
    sheet.getRange(fila, 10).setValue(datos.cajera);     // cajera
    sheet.getRange(fila, 11).setValue(datos.folioRecibo); // folio_recibo
    sheet.getRange(fila, 12).setValue('Enviado');        // estatus_envio
    
    var asunto = "Tu Licencia de ALEKS - Universidad";
    var cuerpo = "Hola " + datos.nombreAlumno + ",\n\n" +
                 "Se ha registrado tu pago exitosamente.\n\n" +
                 "Detalles de la Licencia:\n" +
                 "- Materia: " + datos.materia + "\n" +
                 "- Licencia ALEKS: " + datos.licenciaAleks + "\n" +
                 "- Folio de Recibo: " + datos.folioRecibo + "\n\n" +
                 "Por favor ingresa a la plataforma ALEKS con el código proporcionado.";
                 
    MailApp.sendEmail(datos.correoAlumno, asunto, cuerpo);
    
    return { exito: true, mensaje: 'Pago registrado exitosamente. El correo con la licencia ha sido enviado a ' + datos.correoAlumno };
  } catch(e) {
    return { exito: false, mensaje: 'Ocurrió un error al registrar o enviar el correo: ' + e.toString() };
  }
}

// 4. Búsqueda para Alumno
function buscarAlumnoVista(hora, salon, matricula) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    var rHora = String(data[i][0]).trim();
    var rSalon = String(data[i][1]).trim();
    var rMatricula = String(data[i][4]).trim();
    
    if (rHora === String(hora).trim() && rSalon === String(salon).trim() && rMatricula === String(matricula).trim()) {
      return {
        exito: true,
        nombreAlumno: data[i][5],
        materia: data[i][2],
        nombreMaestro: data[i][3],
        licenciaAleks: data[i][7]
      };
    }
  }
  return { exito: false, mensaje: 'No se encontraron datos asignados a la Hora, Salón y Matrícula ingresados.' };
}