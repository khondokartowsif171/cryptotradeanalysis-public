
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializePwa } from './lib/pwa'

// Remove dark mode class addition
initializePwa();
createRoot(document.getElementById("root")!).render(<App />);
