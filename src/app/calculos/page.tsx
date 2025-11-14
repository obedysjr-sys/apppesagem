import { PageContent } from "@/components/layout/page-content";
import { CalculosForm } from "./calculos-form";

export default function CalculosPage() {
    return (
        <PageContent title="Cálculo de Pesagem" subtitle="Registre uma nova pesagem aqui.">
            <CalculosForm />
        </PageContent>
    );
}
