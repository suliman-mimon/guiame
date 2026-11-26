import PanelShell from "@/components/panel/PanelShell";
import { claseDePrueba } from "@/components/panel/datosDePrueba";

// Layout de todas las pantallas del panel del profesional (/panel/...).
// El acceso ya lo protege src/proxy.ts; la comprobación de rol llega con GM-06.
// La clase sale de datos de prueba hasta que GM-15 la devuelva del servidor.

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell clase={claseDePrueba}>{children}</PanelShell>;
}
