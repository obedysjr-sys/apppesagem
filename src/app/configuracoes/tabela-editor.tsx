"use client"

import { useState } from "react";
import { toast } from "sonner";
import { PlusCircle, RefreshCw, Upload, Download } from "lucide-react";
import {
    ColumnDef,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTabelas, defaultS4Rules, TabelaRule } from "@/lib/tabelas-mock";
import { DataTable } from "@/app/relatorios/data-table";
import { DataTablePagination } from "@/app/relatorios/data-table-pagination";
import { getColumns } from "./columns";
import { RuleDialog } from "./rule-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type TabelaKey = keyof typeof mockTabelas;

// Componente interno para encapsular a lógica da tabela de configurações
const TabelaConfig = ({ columns, data }: { columns: ColumnDef<TabelaRule>[], data: TabelaRule[] }) => {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="space-y-4">
            <DataTable table={table} />
            <DataTablePagination table={table} />
        </div>
    );
};


export function TabelaEditor() {
    const [tabelas, setTabelas] = useState(mockTabelas);
    const [activeTab, setActiveTab] = useState<TabelaKey>("S4");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<TabelaRule | null>(null);
    const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

    const handleAddRule = () => {
        setEditingRule(null);
        setIsDialogOpen(true);
    };

    const handleEditRule = (rule: TabelaRule) => {
        setEditingRule(rule);
        setIsDialogOpen(true);
    };

    const handleDeleteRule = (ruleId: string) => {
        setTabelas(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].filter(r => r.id !== ruleId)
        }));
        toast.success("Regra excluída com sucesso.");
        setDeletingRuleId(null);
    };

    const handleSaveRule = (rule: TabelaRule) => {
        setTabelas(prev => {
            const table = prev[activeTab];
            const existingIndex = table.findIndex(r => r.id === rule.id);
            let updatedTable;

            if (existingIndex > -1) {
                updatedTable = [...table];
                updatedTable[existingIndex] = rule;
            } else {
                updatedTable = [...table, rule];
            }
            
            updatedTable.sort((a, b) => a.min - b.min);

            return { ...prev, [activeTab]: updatedTable };
        });
        toast.success(`Regra ${editingRule ? 'atualizada' : 'adicionada'} com sucesso.`);
    };

    const handleRestoreS4 = () => {
        setTabelas(prev => ({
            ...prev,
            S4: defaultS4Rules
        }));
        toast.info("Tabela S4 restaurada para os valores padrão.");
    };

    const columns = getColumns({ onEdit: handleEditRule, onDelete: (id) => setDeletingRuleId(id) });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Editor de Tabelas de Amostragem</CardTitle>
                <CardDescription>Gerencie as regras para os planos de amostragem S1, S2, S3 e S4.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabelaKey)}>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <TabsList>
                            <TabsTrigger value="S1">S1</TabsTrigger>
                            <TabsTrigger value="S2">S2</TabsTrigger>
                            <TabsTrigger value="S3">S3</TabsTrigger>
                            <TabsTrigger value="S4">S4</TabsTrigger>
                        </TabsList>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleAddRule}><PlusCircle /> Adicionar Regra</Button>
                            {activeTab === 'S4' && (
                                <Button variant="secondary" size="sm" onClick={handleRestoreS4}><RefreshCw /> Restaurar S4</Button>
                            )}
                             <Button variant="outline" size="sm" disabled><Download /> Exportar</Button>
                             <Button variant="outline" size="sm" disabled><Upload /> Importar</Button>
                        </div>
                    </div>
                    {Object.keys(tabelas).map(key => (
                        <TabsContent key={key} value={key}>
                            <TabelaConfig columns={columns} data={tabelas[key as TabelaKey]} />
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>

            <RuleDialog 
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleSaveRule}
                initialData={editingRule}
            />

            <AlertDialog open={!!deletingRuleId} onOpenChange={() => setDeletingRuleId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a regra da tabela.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingRuleId(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteRule(deletingRuleId!)}>
                        Confirmar Exclusão
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
