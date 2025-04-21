const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Función para buscar archivos JavaScript y JSX de manera recursiva
async function findJsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      files.push(...await findJsFiles(fullPath));
    } else if (stats.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Función para corregir las importaciones de iconos
async function fixImports(filePath) {
  try {
    let content = await readFileAsync(filePath, 'utf8');
    
    // Buscar importaciones de iconos desde @mui/icons-material
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]@mui\/icons-material['"]/g;
    
    let match;
    let modified = false;
    
    while ((match = importRegex.exec(content)) !== null) {
      modified = true;
      const importedIcons = match[1].split(',').map(icon => {
        const parts = icon.trim().split(/\s+as\s+/);
        if (parts.length === 2) {
          // Caso: IconName as AliasName
          return {
            original: parts[0].trim(),
            alias: parts[1].trim(),
            full: icon.trim()
          };
        }
        return {
          original: icon.trim(),
          alias: icon.trim(),
          full: icon.trim()
        };
      });
      
      // Reemplazar la importación colectiva por importaciones individuales
      const newImports = importedIcons.map(icon => 
        `import ${icon.alias} from '@mui/icons-material/${icon.original}';`
      ).join('\n');
      
      content = content.replace(match[0], newImports);
    }
    
    if (modified) {
      await writeFileAsync(filePath, content, 'utf8');
      console.log(`✅ Actualizado: ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Error al procesar ${filePath}:`, err);
  }
}

// Función principal
async function main() {
  try {
    const srcDir = path.join(__dirname, 'src');
    const files = await findJsFiles(srcDir);
    
    console.log(`Encontrados ${files.length} archivos JavaScript/JSX para procesar...`);
    
    // Procesar todos los archivos
    for (const file of files) {
      await fixImports(file);
    }
    
    console.log('✅ Proceso completado.');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();