import { OPTIMIZATION_RESOURCES, getResourceUrl, getLocalResourcePath } from '@/lib/optimizationResources';
import { toast } from 'sonner';

interface DownloadProgress {
  fileName: string;
  downloaded: number;
  total: number;
  percentage: number;
}

export class OptimizationResourceManager {
  private static isInitialized = false;
  private static downloadQueue: string[] = [];

  /**
   * Inicializa download de recursos na primeira execução
   */
  static async initialize() {
    if (this.isInitialized) return;

    try {
      const electronAPI = (window as any).electronAPI;
      if (!electronAPI) return;

      // Verifica quais recursos estão faltando
      const missingResources = await this.getMissingResources();

      if (missingResources.length > 0) {
        console.log(`Recursos faltando: ${missingResources.length}. Iniciando download...`);
        await this.downloadResources(missingResources);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar recursos:', error);
      // Continua mesmo com erro, não bloqueia a aplicação
    }
  }

  /**
   * Verifica quais recursos estão faltando localmente
   */
  static async getMissingResources(): Promise<string[]> {
    const missing: string[] = [];

    for (const resource of OPTIMIZATION_RESOURCES) {
      try {
        const electronAPI = (window as any).electronAPI;
        const localPath = `${electronAPI.getAppPath?.() || ''}/otimizacoes-byte/${resource.name}.${resource.type}`;
        
        // Verifica se arquivo existe (essa função precisa estar no preload)
        const exists = await electronAPI.fileExists?.(localPath);
        
        if (!exists) {
          missing.push(resource.path);
        }
      } catch (error) {
        console.warn(`Erro ao verificar ${resource.name}:`, error);
        missing.push(resource.path);
      }
    }

    return missing;
  }

  /**
   * Baixa recursos do CDN
   */
  static async downloadResources(resourcePaths: string[]): Promise<void> {
    const electronAPI = (window as any).electronAPI;
    
    if (!electronAPI || !electronAPI.downloadFile) {
      console.warn('API de download não disponível');
      return;
    }

    toast.info(`Baixando ${resourcePaths.length} arquivos de otimização...`);

    for (let i = 0; i < resourcePaths.length; i++) {
      const resource = resourcePaths[i];
      const resourceData = OPTIMIZATION_RESOURCES.find(r => r.path === resource);

      if (!resourceData) continue;

      try {
        const url = getResourceUrl(resource);
        const fileName = resource.split('/').pop() || '';
        const category = resourceData.category.replace(/\s+/g, '_');
        
        const localPath = `${electronAPI.getAppPath?.() || ''}/otimizacoes-byte/${category}/${fileName}`;

        // Inicia download
        await electronAPI.downloadFile({
          url,
          path: localPath,
          onProgress: (progress: DownloadProgress) => {
            const overallProgress = ((i + progress.percentage / 100) / resourcePaths.length) * 100;
            console.log(`Download ${i + 1}/${resourcePaths.length}: ${overallProgress.toFixed(0)}%`);
          }
        });

        console.log(`✓ ${resourceData.name} baixado com sucesso`);
      } catch (error) {
        console.error(`Erro ao baixar ${resourceData.name}:`, error);
        // Continua com próximo arquivo
      }
    }

    toast.success('Recursos de otimização baixados com sucesso!');
  }

  /**
   * Baixa um recurso específico sob demanda
   */
  static async downloadResource(resourcePath: string): Promise<boolean> {
    const electronAPI = (window as any).electronAPI;

    if (!electronAPI || !electronAPI.downloadFile) {
      console.warn('API de download não disponível');
      return false;
    }

    const resource = OPTIMIZATION_RESOURCES.find(r => r.path === resourcePath);
    if (!resource) {
      console.error(`Recurso não encontrado: ${resourcePath}`);
      return false;
    }

    try {
      toast.info(`Baixando ${resource.name}...`);

      const url = getResourceUrl(resourcePath);
      const fileName = resourcePath.split('/').pop() || '';
      const category = resource.category.replace(/\s+/g, '_');
      const localPath = `${electronAPI.getAppPath?.() || ''}/otimizacoes-byte/${category}/${fileName}`;

      await electronAPI.downloadFile({
        url,
        path: localPath
      });

      toast.success(`${resource.name} baixado com sucesso!`);
      return true;
    } catch (error) {
      console.error(`Erro ao baixar ${resource.name}:`, error);
      toast.error(`Erro ao baixar ${resource.name}`);
      return false;
    }
  }

  /**
   * Obtém o caminho local de um recurso, baixando se necessário
   */
  static async ensureResource(resourcePath: string): Promise<string | null> {
    const electronAPI = (window as any).electronAPI;
    
    if (!electronAPI) return null;

    const resource = OPTIMIZATION_RESOURCES.find(r => r.path === resourcePath);
    if (!resource) return null;

    const fileName = resourcePath.split('/').pop() || '';
    const category = resource.category.replace(/\s+/g, '_');
    const localPath = `${electronAPI.getAppPath?.() || ''}/otimizacoes-byte/${category}/${fileName}`;

    try {
      // Verifica se existe
      const exists = await electronAPI.fileExists?.(localPath);
      
      if (!exists) {
        // Baixa o arquivo
        const downloaded = await this.downloadResource(resourcePath);
        if (!downloaded) return null;
      }

      return localPath;
    } catch (error) {
      console.error(`Erro ao garantir recurso ${resource.name}:`, error);
      return null;
    }
  }
}
