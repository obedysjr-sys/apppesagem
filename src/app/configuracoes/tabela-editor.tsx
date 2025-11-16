"use client"

import { useEffect, useMemo, useState } from "react";
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
import { supabase as supabaseClient, hasSupabaseEnv } from "@/lib/supabase";
import { ProductDialog } from "./product-dialog";

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
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<TabelaRule | null>(null);
    const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

    const tableMap: Record<TabelaKey, string> = {
        S1: 's1_rules',
        S2: 's2_rules',
        S3: 's3_rules',
        S4: 's4_rules',
    };

    // Helpers de conversão
    const toLocalRule = (row: any): TabelaRule => ({
        id: row.id,
        min: Number(row.min ?? 0),
        max: typeof row.max === 'number' ? Number(row.max) : (row.max == null ? Infinity : Number(row.max)),
        sample: Number(row.sample ?? 0),
    });
    const toDbRule = (rule: TabelaRule) => ({
        id: /^[0-9a-fA-F-]{36}$/.test(rule.id) ? rule.id : undefined,
        min: rule.min,
        max: rule.max === Infinity ? null : rule.max,
        sample: rule.sample,
    });

    // Carregar regras do Supabase
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (!hasSupabaseEnv) return;
                const entries: [TabelaKey, string][] = Object.entries(tableMap) as any;
                const results = await Promise.all(entries.map(([key, table]) => supabaseClient.from(table).select('*').order('min', { ascending: true })));
                const next: typeof mockTabelas = { S1: [], S2: [], S3: [], S4: [] } as any;
                results.forEach((res, idx) => {
                    const key = entries[idx][0] as TabelaKey;
                    if (res.data && Array.isArray(res.data)) {
                        next[key] = res.data.map(toLocalRule);
                    }
                });
                if (mounted) setTabelas(next);
            } catch (err) {
                console.warn('Falha ao carregar regras do Supabase:', err);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Assinaturas realtime para S1–S4
    useEffect(() => {
        if (!hasSupabaseEnv) return;
        const channels: any[] = [];
        (['s1_rules','s2_rules','s3_rules','s4_rules'] as const).forEach(table => {
            const ch = supabaseClient
                .channel(`${table}_changes`)
                .on('postgres_changes', { event: '*', schema: 'public', table }, (payload: any) => {
                    const evt = payload?.eventType || payload?.event || '';
                    const key = (Object.keys(tableMap).find(k => tableMap[k as TabelaKey] === table) || 'S4') as TabelaKey;
                    if (evt === 'INSERT' && payload?.new) {
                        const newRule = toLocalRule(payload.new);
                        setTabelas(prev => ({...prev, [key]: [...prev[key], newRule].sort((a,b)=>a.min-b.min)}));
                    } else if (evt === 'UPDATE' && payload?.new) {
                        const upd = toLocalRule(payload.new);
                        setTabelas(prev => ({...prev, [key]: prev[key].map(r => r.id === upd.id ? upd : r).sort((a,b)=>a.min-b.min)}));
                    } else if (evt === 'DELETE' && payload?.old) {
                        const delId = payload.old.id;
                        setTabelas(prev => ({...prev, [key]: prev[key].filter(r => r.id !== delId)}));
                    }
                })
                .subscribe();
            channels.push(ch);
        });
        return () => {
            channels.forEach(ch => { try { supabaseClient.removeChannel(ch); } catch {} });
        };
    }, []);

    const handleAddRule = () => {
        setEditingRule(null);
        setIsDialogOpen(true);
    };

    const handleEditRule = (rule: TabelaRule) => {
        setEditingRule(rule);
        setIsDialogOpen(true);
    };

    const handleDeleteRule = async (ruleId: string) => {
        try {
            if (hasSupabaseEnv) {
                const table = tableMap[activeTab];
                const { error } = await supabaseClient.from(table).delete().eq('id', ruleId);
                if (error) throw error;
            }
            setTabelas(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].filter(r => r.id !== ruleId)
            }));
            toast.success("Regra excluída com sucesso.");
        } catch (err) {
            console.warn('Falha ao excluir regra:', err);
            toast.error('Falha ao excluir regra no Supabase.');
        } finally {
            setDeletingRuleId(null);
        }
    };

    const handleSaveRule = async (rule: TabelaRule) => {
        try {
            // Persistir no Supabase
            if (hasSupabaseEnv) {
                const table = tableMap[activeTab];
                const payload = toDbRule(rule);
                const { data, error } = await supabaseClient
                    .from(table)
                    .upsert(payload, { onConflict: 'id' })
                    .select('*')
                    .single();
                if (error) throw error;
                const saved = toLocalRule(data);
                setTabelas(prev => {
                    const arr = prev[activeTab];
                    const idx = arr.findIndex(r => r.id === rule.id);
                    const nextArr = idx > -1 ? arr.map(r => r.id === rule.id ? saved : r) : [...arr, saved];
                    nextArr.sort((a,b)=>a.min-b.min);
                    return { ...prev, [activeTab]: nextArr };
                });
            } else {
                // Fallback local
                setTabelas(prev => {
                    const tableLocal = prev[activeTab];
                    const existingIndex = tableLocal.findIndex(r => r.id === rule.id);
                    let updatedTable;
                    if (existingIndex > -1) {
                        updatedTable = [...tableLocal];
                        updatedTable[existingIndex] = rule;
                    } else {
                        updatedTable = [...tableLocal, rule];
                    }
                    updatedTable.sort((a, b) => a.min - b.min);
                    return { ...prev, [activeTab]: updatedTable };
                });
            }
            toast.success(`Regra ${editingRule ? 'atualizada' : 'adicionada'} com sucesso.`);
        } catch (err) {
            console.warn('Falha ao salvar regra:', err);
            toast.error('Falha ao salvar regra no Supabase.');
        }
    };

    const handleRestoreS4 = async () => {
        try {
            if (hasSupabaseEnv) {
                const { error: delErr } = await supabaseClient.from('s4_rules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                if (delErr) throw delErr;
                const payload = defaultS4Rules.map(r => ({ min: r.min, max: r.max === Infinity ? null : r.max, sample: r.sample }));
                const { error: insErr } = await supabaseClient.from('s4_rules').insert(payload);
                if (insErr) throw insErr;
                const { data: fresh } = await supabaseClient.from('s4_rules').select('*').order('min',{ascending:true});
                setTabelas(prev => ({ ...prev, S4: (fresh || []).map(toLocalRule) }));
            } else {
                setTabelas(prev => ({ ...prev, S4: defaultS4Rules }));
            }
            toast.info("Tabela S4 restaurada para os valores padrão.");
        } catch (err) {
            console.warn('Falha ao restaurar S4:', err);
            toast.error('Falha ao restaurar a tabela S4 no Supabase.');
        }
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
                            <Button variant="default" size="sm" onClick={() => setIsProductDialogOpen(true)}>Cadastro de Produto</Button>
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

            <ProductDialog isOpen={isProductDialogOpen} onOpenChange={setIsProductDialogOpen} />
        </Card>
    );
}
