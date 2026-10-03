import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

document.documentElement.classList.remove('light');
document.documentElement.classList.add('dark');

// Silence noisy logs in prod, but keep warn/error for monitoring
// (logger.error uses console.error — nuking it blinds Sentry/LogRocket).
if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
}

createRoot(document.getElementById("root")!).render(<App />);
