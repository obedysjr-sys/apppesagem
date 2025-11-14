import { PageContent } from "@/components/layout/page-content";
import { TabelaEditor } from "./tabela-editor";

export default function ConfiguracoesPage() {
    return (
        <PageContent title="Configurações" subtitle="Gerencie as tabelas e outras configurações do sistema.">
             <TabelaEditor />
        </PageContent>
    );
}
