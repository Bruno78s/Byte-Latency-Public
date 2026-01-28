/**
 * Recursos de otimização que serão baixados dinamicamente
 * Armazenados em um servidor CDN para manter o setup leve
 */

export interface OptimizationResource {
  type: 'reg' | 'bat';
  name: string;
  path: string;
  category: string;
  description: string;
  url?: string; // URL do CDN para download
}

export const OPTIMIZATION_RESOURCES: OptimizationResource[] = [
  // DESEMPENHO GERAL DO SISTEMA
  {
    type: 'reg',
    path: 'otimizacoes-byte/DESEMPENHO GERAL DO SISTEMA/Power Throttling off.reg',
    name: 'Power Throttling',
    category: 'DESEMPENHO GERAL DO SISTEMA',
    description: 'Desativa Power Throttling para melhor desempenho'
  },
  {
    type: 'reg',
    path: 'otimizacoes-byte/DESEMPENHO GERAL DO SISTEMA/Processor Scheduling.reg',
    name: 'Processor Scheduling',
    category: 'DESEMPENHO GERAL DO SISTEMA',
    description: 'Otimiza scheduling de processos'
  },
  {
    type: 'reg',
    path: 'otimizacoes-byte/DESEMPENHO GERAL DO SISTEMA/Superfetch off.reg',
    name: 'Superfetch',
    category: 'DESEMPENHO GERAL DO SISTEMA',
    description: 'Desativa Superfetch para liberar RAM'
  },
  {
    type: 'reg',
    path: 'otimizacoes-byte/DESEMPENHO GERAL DO SISTEMA/SystemResponsiveness + GPU.reg',
    name: 'System Responsiveness',
    category: 'DESEMPENHO GERAL DO SISTEMA',
    description: 'Melhora responsividade do sistema'
  },
  {
    type: 'reg',
    path: 'otimizacoes-byte/DESEMPENHO GERAL DO SISTEMA/Windows Mais Rápido.reg',
    name: 'Windows Performance',
    category: 'DESEMPENHO GERAL DO SISTEMA',
    description: 'Otimizações gerais do Windows'
  },

  // FPS e INPUT LAG
  {
    type: 'bat',
    path: 'otimizacoes-byte/FPSeINPUT LAG/Aumentar fps.bat',
    name: 'Aumentar FPS',
    category: 'FPSeINPUT LAG',
    description: 'Script para aumentar FPS em jogos'
  },
  {
    type: 'bat',
    path: 'otimizacoes-byte/FPSeINPUT LAG/Deixa jogo mais fluido.bat',
    name: 'Fluidez de Jogos',
    category: 'FPSeINPUT LAG',
    description: 'Deixa jogos mais fluidos e responsivos'
  },
  {
    type: 'bat',
    path: 'otimizacoes-byte/FPSeINPUT LAG/Diminui Input lag.bat',
    name: 'Reduzir Input Lag',
    category: 'FPSeINPUT LAG',
    description: 'Reduz latência de entrada'
  },
  {
    type: 'reg',
    path: 'otimizacoes-byte/FPSeINPUT LAG/Reduzir Input Lag.reg',
    name: 'Registry Input Lag',
    category: 'FPSeINPUT LAG',
    description: 'Otimizações de registro para input lag'
  },

  // OTIMIZAÇÕES NO REGISTRO
  {
    type: 'reg',
    path: 'otimizacoes-byte/OTIMIZAÇÕES NO REGISTRO/Desativa dvr.reg',
    name: 'Desativar DVR',
    category: 'OTIMIZAÇÕES NO REGISTRO',
    description: 'Desativa Game DVR'
  },
  {
    type: 'reg',
    path: 'otimizacoes-byte/OTIMIZAÇÕES NO REGISTRO/Liberar nucleos.reg',
    name: 'Liberar Núcleos',
    category: 'OTIMIZAÇÕES NO REGISTRO',
    description: 'Libera núcleos de CPU para aplicações'
  },
  {
    type: 'reg',
    path: 'otimizacoes-byte/OTIMIZAÇÕES NO REGISTRO/PC fraco ATT- .reg',
    name: 'Otimizar PC',
    category: 'OTIMIZAÇÕES NO REGISTRO',
    description: 'Otimizações para PCs menos poderosos'
  },
  {
    type: 'reg',
    path: 'otimizacoes-byte/OTIMIZAÇÕES NO REGISTRO/Ping Optimization.reg',
    name: 'Otimizar Ping',
    category: 'OTIMIZAÇÕES NO REGISTRO',
    description: 'Reduz latência de rede'
  },
  {
    type: 'reg',
    path: 'otimizacoes-byte/OTIMIZAÇÕES NO REGISTRO/Recuperando RAM após o fechamento dos programas.reg',
    name: 'Recuperar RAM',
    category: 'OTIMIZAÇÕES NO REGISTRO',
    description: 'Libera RAM após fechar programas'
  },
];

/**
 * URL base do CDN onde os arquivos estão hospedados
 * Configure com seu servidor CDN (ex: GitHub Releases, AWS S3, etc)
 */
export const CDN_BASE_URL = import.meta.env.VITE_CDN_URL || 'https://cdn.bytelatency.com/otimizacoes';

/**
 * Retorna a URL completa de um recurso
 */
export function getResourceUrl(resourcePath: string): string {
  const fileName = resourcePath.split('/').pop() || '';
  return `${CDN_BASE_URL}/${fileName}`;
}

/**
 * Retorna o caminho local onde o recurso será armazenado
 */
export function getLocalResourcePath(resourcePath: string): string {
  const appPath = (window as any).electronAPI?.getAppPath?.() || '';
  return `${appPath}/${resourcePath}`;
}
