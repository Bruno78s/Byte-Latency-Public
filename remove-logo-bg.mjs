import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function removeLogoBackground(inputPath, outputPath) {
  try {
    console.log(`\n🔄 Processando logo: ${path.basename(inputPath)}...`);
    
    const buffer = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { data, info } = buffer;
    const pixelArray = Buffer.from(data);
    
    console.log(`   Dimensões: ${info.width}x${info.height}`);
    
    let changedPixels = 0;
    
    // Iterar sobre cada pixel RGBA
    for (let i = 0; i < pixelArray.length; i += 4) {
      const r = pixelArray[i];
      const g = pixelArray[i + 1];
      const b = pixelArray[i + 2];
      const a = pixelArray[i + 3];
      
      // Remover fundos brancos e cinzas muito claros
      if (r > 200 && g > 200 && b > 200) {
        pixelArray[i + 3] = 0;
        changedPixels++;
      }
      // Remover fundos levemente coloridos
      else if (r > 180 && g > 180 && b > 180 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15) {
        pixelArray[i + 3] = 0;
        changedPixels++;
      }
    }
    
    console.log(`   Pixels alterados: ${changedPixels}`);
    
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

async function main() {
  console.log('\n🎨 ================================');
  console.log('   Removendo Fundo dos Logos');
  console.log('================================');
  
  const basePath = __dirname;
  
  const logos = [
    {
      input: path.join(basePath, 'public', 'Logo1.png'),
      output: path.join(basePath, 'public', 'Logo1-transparent.png')
    },
    {
      input: path.join(basePath, 'public', 'ByteLatency.png'),
      output: path.join(basePath, 'public', 'ByteLatency-logo-transparent.png')
    }
  ];
  
  for (const logo of logos) {
    if (fs.existsSync(logo.input)) {
      await removeLogoBackground(logo.input, logo.output);
    } else {
      console.log(`⚠️  Arquivo não encontrado: ${path.basename(logo.input)}`);
    }
  }
  
  console.log('\n✓ Processo concluído!\n');
}

main().catch(console.error);
