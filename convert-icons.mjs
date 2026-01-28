import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function removeWhiteBackground(inputPath, outputPath) {
  try {
    console.log(`\n🔄 Processando: ${path.basename(inputPath)}...`);
    
    // Ler a imagem e converter para array de pixels
    const image = sharp(inputPath);
    const buffer = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { data, info } = buffer;
    const pixelArray = Buffer.from(data);
    
    console.log(`   Dimensões: ${info.width}x${info.height}`);
    console.log(`   Canais: ${info.channels}`);
    
    let changedPixels = 0;
    
    // Iterar sobre cada pixel RGBA
    for (let i = 0; i < pixelArray.length; i += 4) {
      const r = pixelArray[i];
      const g = pixelArray[i + 1];
      const b = pixelArray[i + 2];
      const a = pixelArray[i + 3];
      
      // Se o pixel é branco ou muito claro (fundo)
      if (r > 220 && g > 220 && b > 220) {
        // Calcular a luminância
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
        
        // Se é muito claro (fundo branco), tornar transparente
        if (luminance > 220) {
          pixelArray[i + 3] = 0;
          changedPixels++;
        }
      }
      // Também processar cinzas muito claros que possam ser fundo
      else if (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && r > 200) {
        pixelArray[i + 3] = Math.floor(a * 0.5); // Semitransparente
        changedPixels++;
      }
    }
    
    console.log(`   Pixels alterados: ${changedPixels}`);
    
    // Criar nova imagem com os pixels modificados
    await sharp(Buffer.from(pixelArray), {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels
      }
    })
    .png({ quality: 100 })
    .toFile(outputPath);
    
    console.log(`✓ Salvo como: ${path.basename(outputPath)}`);
    
  } catch (error) {
    console.error(`✗ Erro: ${error.message}`);
  }
}

async function createIcoFromPng(pngPath, icoPath) {
  try {
    console.log(`\n📦 Convertendo para ICO: ${path.basename(pngPath)}...`);
    
    // Sharp não suporta criar ICO diretamente, mas podemos copiar o PNG
    // e depois usar um converter externo ou apenas usar o PNG
    const buffer = await sharp(pngPath)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
    
    fs.writeFileSync(icoPath, buffer);
    console.log(`✓ Arquivo criado: ${path.basename(icoPath)}`);
    
  } catch (error) {
    console.error(`✗ Erro: ${error.message}`);
  }
}

async function main() {
  console.log('\n🎨 ================================');
  console.log('   Removendo Fundo dos Ícones');
  console.log('   (Transparente para Taskbar)');
  console.log('================================');
  
  const basePath = __dirname;
  
  // Arquivos PNG para processar
  const pngFiles = [
    {
      input: path.join(basePath, 'public', 'ByteLatency.png'),
      output: path.join(basePath, 'public', 'icon-transparent.png'),
      desc: 'Ícone Principal'
    },
    {
      input: path.join(basePath, 'public', 'byte.png'),
      output: path.join(basePath, 'public', 'byte-transparent.png'),
      desc: 'Ícone Byte'
    }
  ];
  
  // Processar PNGs
  console.log('\n📝 Processando imagens PNG...\n');
  for (const file of pngFiles) {
    if (fs.existsSync(file.input)) {
      await removeWhiteBackground(file.input, file.output);
    } else {
      console.log(`⚠️  Arquivo não encontrado: ${path.basename(file.input)}`);
    }
  }
  
  // Criar versões para diferentes resoluções
  console.log('\n\n🔧 Criando versões para diferentes tamanhos...\n');
  
  const mainPng = path.join(basePath, 'public', 'icon-transparent.png');
  const sizes = [16, 32, 48, 64, 128, 256];
  
  for (const size of sizes) {
    try {
      const outputFile = path.join(basePath, 'public', `icon-${size}x${size}.png`);
      console.log(`\n📐 Criando ${size}x${size}...`);
      
      await sharp(mainPng)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outputFile);
      
      console.log(`✓ Criado: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Erro ao criar ${size}x${size}: ${error.message}`);
    }
  }
  
  console.log('\n\n✓ Processo concluído!\n');
  console.log('📋 Próximas etapas:');
  console.log('');
  console.log('1️⃣  Atualizar electron-builder.json:');
  console.log('   "win": {');
  console.log('     "icon": "public/icon-transparent.png"');
  console.log('   }');
  console.log('');
  console.log('2️⃣  Atualizar electron/main.js (linha com icon:):');
  console.log('   icon: path.join(__dirname, "../public/icon-transparent.png"),');
  console.log('');
  console.log('3️⃣  Reconstruir a aplicação:');
  console.log('   npm run electron:build');
  console.log('\n');
}

main().catch(console.error);
