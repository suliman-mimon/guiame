import PanelShell from "@/components/panel/PanelShell";

// Layout de todas las pantallas del panel del profesional (/panel/...).
// El acceso lo protege src/proxy.ts (GM-06: solo tutores y administradores) y
// cada consulta vuelve a comprobar los permisos en el servidor (GM-04).

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>;
}
