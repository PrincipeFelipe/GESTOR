const fs = require('fs');
const path = require('path');

const filesWithProblems = [
  'src/components/Auth/Login.js',
  'src/components/Auth/Register.js',
  'src/components/Layout/Header.js',
  'src/components/Procedimientos/BifurcacionesManager.js',
  'src/components/Procedimientos/PasoDocumentosManager.js',
  'src/components/Procedimientos/PasosManager.js',
  'src/components/Procedimientos/ProcedimientoCadena.js',
  'src/components/Procedimientos/ProcedimientoForm.js',
  'src/components/Procedimientos/TiposProcedimientosList.js',
  'src/components/Profile/ChangePassword.js',
  'src/components/Profile/UserProfile.js',
  'src/components/Unidades/UnidadTree.js',
  'src/components/Unidades/UnidadesList.js',
  'src/components/Users/UserDetail.js',
  'src/components/Users/UsersList.js',
  'src/components/common/DocumentPreview.js',
  'src/pages/UnidadesPage.js'
];

function processFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Extraer todas las importaciones
    const importRegex = /import .+?from ['"].+?['"];?/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[0]);
    }
    
    if (imports.length === 0) {
      console.log(`No se encontraron importaciones en ${filePath}`);
      return;
    }
    
    // Eliminar todas las importaciones del contenido
    content = content.replace(importRegex, '');
    
    // Eliminar líneas vacías generadas al eliminar importaciones
    content = content.replace(/^\s*[\r\n]/gm, '');
    
    // Asegurarse de que cada importación termina con punto y coma
    const formattedImports = imports.map(imp => 
      imp.endsWith(';') ? imp : imp + ';'
    );
    
    // Reemplazar importaciones duplicadas
    const uniqueImports = [...new Set(formattedImports)];
    
    // Crear el nuevo contenido del archivo
    const newContent = uniqueImports.join('\n') + '\n\n' + content.trim();
    
    // Escribir el archivo actualizado
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ Corregido: ${filePath}`);
  } catch (err) {
    console.error(`❌ Error al procesar ${filePath}:`, err);
  }
}

// Procesar todos los archivos
filesWithProblems.forEach(processFile);
console.log('Proceso completado.');