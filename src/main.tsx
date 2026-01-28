import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Debug: Verificar se window.electron está disponível
console.log('[Main.tsx] window.electron:', (window as any).electron);
console.log('[Main.tsx] window.electronAPI:', (window as any).electronAPI);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Make sure index.html has an element with id='root'");
}

createRoot(rootElement).render(<App />);
