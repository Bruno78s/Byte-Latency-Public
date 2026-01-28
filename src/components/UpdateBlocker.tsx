import { useEffect, useState } from "react";

export function UpdateBlocker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onUpdateAvailable?.(() => setUpdateAvailable(true));
      window.electronAPI.onUpdateDownloaded?.(() => setUpdateDownloaded(true));
      window.electronAPI.onUpdateError?.((msg: string) => setError(msg));
    } else if (window.electron) {
      // fallback para preload antigo
      window.electron.onUpdateAvailable?.(() => setUpdateAvailable(true));
      window.electron.onUpdateDownloaded?.(() => setUpdateDownloaded(true));
      window.electron.onUpdateError?.((msg: string) => setError(msg));
    }
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0e27] bg-opacity-95">
        <div className="bg-[#1a1f3a] p-8 rounded-2xl border border-red-500/30 text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Erro ao buscar atualização</h2>
          <p className="text-white mb-4">{error}</p>
          <p className="text-gray-400">Feche e abra o aplicativo novamente ou baixe a versão mais recente no site.</p>
        </div>
      </div>
    );
  }

  if (updateAvailable || updateDownloaded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0e27] bg-opacity-95">
        <div className="bg-[#1a1f3a] p-8 rounded-2xl border border-blue-500/30 text-center max-w-md">
          <h2 className="text-2xl font-bold text-blue-400 mb-2">Atualização disponível</h2>
          <p className="text-white mb-4">
            Uma nova versão do Byte Latency foi encontrada.<br />
            O aplicativo será atualizado automaticamente.<br />
            <span className="text-sm text-gray-400">(Você não poderá usar o app até atualizar)</span>
          </p>
          {updateDownloaded ? (
            <p className="text-green-400 font-semibold">Atualização baixada! Reinicie o app para aplicar.</p>
          ) : (
            <p className="text-blue-300">Baixando atualização...</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
