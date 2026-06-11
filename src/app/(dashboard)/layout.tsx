import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#faf8f4]">
      <Sidebar />
      {/* Conteúdo principal — deslocado pela largura do sidebar (256px = w-64) */}
      <main className="flex-1 overflow-y-auto lg:ml-64 lg:pt-0" style={{ paddingTop: "var(--header-offset)" }}>
        {children}
      </main>
    </div>
  );
}
