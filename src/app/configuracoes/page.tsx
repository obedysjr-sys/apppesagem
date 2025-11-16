import { PageContent } from "@/components/layout/page-content";
import { TabelaEditor } from "./tabela-editor";

export default function ConfiguracoesPage() {
return (
    <PageContent 
        title="Configurações" 
        subtitle="Gerencie as tabelas e outras configurações do sistema."
    >
        <div className="w-full max-w-full overflow-hidden">
            <div className="w-full max-w-full overflow-x-auto">
                <TabelaEditor />
            </div>
        </div>
    </PageContent>
);
}
