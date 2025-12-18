import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { addDays, format, startOfDay, subDays } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, LabelList } from 'recharts';
import { Box, Boxes, CalendarClock, TrendingDown, TrendingUp, Weight, Scale } from 'lucide-react';

import { PageContent } from "@/components/layout/page-content";
import { RegistroPeso } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';

import { SupabaseRegistroPesoRow } from '@/types/supabase-row';

// Carregar registros reais do Supabase
function parseSQLDate(dateStr: string | Date | null | undefined): Date {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr === 'string') {
        const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) {
            const [_, y, mo, d] = m;
            return new Date(Number(y), Number(mo) - 1, Number(d));
        }
        // fallback: try native
        return new Date(dateStr);
    }
    return new Date();
}

function mapRowToRegistroPeso(row: SupabaseRegistroPesoRow): RegistroPeso {
    return {
        id: String(row.id),
        dataRegistro: parseSQLDate(row.data_registro),
        filial: row.filial,
        fornecedor: row.fornecedor ?? undefined,
        notaFiscal: row.nota_fiscal ?? undefined,
        produto: row.produto ?? row.descricao ?? undefined,
        categoria: row.categoria ?? undefined,
        familia: row.familia ?? undefined,
        grupoProduto: row.grupo_produto ?? undefined,
        codigo: row.codigo ?? row.cod_produto ?? undefined,
        modeloTabela: row.modelo_tabela,
        quantidadeRecebida: Number(row.quantidade_recebida ?? 0),
        pesoLiquidoPorCaixa: Number(row.peso_liquido_por_caixa ?? 0),
        quantidadeTabela: Number(row.quantidade_tabela ?? 0),
        quantidadebaixopeso: Number(row.quantidade_baixo_peso ?? 0),
        pesoBrutoAnalise: Number(row.peso_bruto_analise ?? 0),
        taraCaixa: Number(row.tara_caixa ?? 0),
        pesoLiquidoProgramado: Number(row.peso_liquido_programado ?? 0),
        pesoLiquidoAnalise: Number(row.peso_liquido_analise ?? 0),
        pesoLiquidoReal: Number(row.peso_liquido_real ?? 0),
        perdaKg: Number(row.perda_kg ?? 0),
        perdaCx: Number(row.perda_cx ?? 0),
        perdaPercentual: Number(row.perda_percentual ?? 0),
        pesoLiquidoIdealAnalise: Number(row.peso_liquido_ideal_analise ?? 0),
        pesoLiquidoRealAnalise: Number(row.peso_liquido_real_analise ?? 0),
        mediaPesoBaixoPorCaixa: Number(row.media_baixo_peso_por_caixa ?? 0),
        percentualqtdcaixascombaixopeso: Number(row.percentual_qtd_caixas_com_baixo_peso ?? 0),
        mediaqtdcaixascombaixopeso: Number(row.media_qtd_caixas_com_baixo_peso ?? 0),
        mediabaixopesoporcaixa: Number(row.media_baixo_peso_por_cx ?? 0),
    };
}

const initialData: RegistroPeso[] = [];

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

interface CustomAxisTickProps {
    x: number;
    y: number;
    payload: {
        value: string;
    };
}

const CustomXAxisTick = ({ x, y, payload }: CustomAxisTickProps) => {
    const words = payload.value.split(' ');
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={10} fontWeight="bold">
                {words.map((word: string, index: number) => (
                    <tspan x={0} dy={index === 0 ? 0 : 12} key={index}>
                        {word}
                    </tspan>
                ))}
            </text>
        </g>
    );
};

export default function DashboardPage() {
    const [records, setRecords] = useState<RegistroPeso[]>(initialData);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    const [filialQuery, setFilialQuery] = useState('');
    const [fornecedorQuery, setFornecedorQuery] = useState('');
    const [produtoQuery, setProdutoQuery] = useState('');
    const [categoriaQuery, setCategoriaQuery] = useState('');
    const [familiaQuery, setFamiliaQuery] = useState('');
    const [grupoProdutoQuery, setGrupoProdutoQuery] = useState('');

    const clearFilters = () => {
        setFilialQuery('');
        setFornecedorQuery('');
        setProdutoQuery('');
        setCategoriaQuery('');
        setFamiliaQuery('');
        setGrupoProdutoQuery('');
        const now = new Date();
        setDateRange({ from: subDays(now, 29), to: now });
    };

    useEffect(() => {
        let mounted = true;
        const fetchAll = async () => {
            try {
                const { supabase, hasSupabaseEnv } = await import('@/lib/supabase');
                if (!hasSupabaseEnv) return;
                const { data, error } = await supabase
                    .from('registros_peso')
                    .select('*')
                    .order('data_registro', { ascending: false });
                if (error) {
                    console.warn('Erro ao carregar registros_peso:', error);
                    return;
                }
                if (mounted && Array.isArray(data)) {
                    setRecords(data.map(mapRowToRegistroPeso));
                }
            } catch (err) {
                console.warn('Falha ao buscar dados do Supabase:', err);
            }
        };
        (async () => {
            await fetchAll();
        })();
        // Polling de fallback para ambientes com websocket instável
        const interval = setInterval(fetchAll, 15000);
        return () => { mounted = false; clearInterval(interval); };
    }, []);

    // Realtime: atualiza automaticamente quando novos registros são inseridos
    useEffect(() => {
        let channel: ReturnType<any> | null = null;
        (async () => {
            try {
                const { supabase, hasSupabaseEnv } = await import('@/lib/supabase');
                if (!hasSupabaseEnv) return;
                channel = supabase
                    .channel('registros_peso_changes')
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'registros_peso' },
                        (payload: any) => {
                            try {
                                const evt = payload?.eventType || payload?.event || '';
                                if (evt === 'INSERT' && payload?.new) {
                                    setRecords(prev => [mapRowToRegistroPeso(payload.new), ...prev]);
                                } else if (evt === 'UPDATE' && payload?.new) {
                                    setRecords(prev => {
                                        const updated = mapRowToRegistroPeso(payload.new);
                                        return prev.map(r => (r.id === updated.id ? updated : r));
                                    });
                                } else if (evt === 'DELETE' && payload?.old) {
                                    const id = payload.old.id;
                                    setRecords(prev => prev.filter(r => r.id !== id));
                                }
                            } catch (e) {
                                console.warn('Falha ao aplicar payload realtime:', e);
                            }
                        }
                    )
                    .subscribe();
            } catch (err) {
                console.warn('Erro ao inicializar Realtime:', err);
            }
        })();
        return () => {
            (async () => {
                try {
                    const { supabase, hasSupabaseEnv } = await import('@/lib/supabase');
                    if (!hasSupabaseEnv) return;
                    if (channel) supabase.removeChannel(channel as any);
                } catch {}
            })();
        };
    }, []);

    const filteredData = useMemo(() => {
        if (!dateRange?.from) return [];
        const startDate = startOfDay(dateRange.from);
        const endDate = dateRange.to ? startOfDay(addDays(dateRange.to, 1)) : startOfDay(addDays(startDate, 1));
        
        const inRange = records.filter(item => {
            const itemDate = startOfDay(item.dataRegistro);
            return itemDate >= startDate && itemDate < endDate;
        });
        const matchText = (val: any, q: string) => {
            if (!q) return true;
            const s = String(val ?? '').toLowerCase();
            return s.includes(q.toLowerCase());
        };
        return inRange.filter(item =>
            matchText(item.filial, filialQuery) &&
            matchText((item as any).fornecedor, fornecedorQuery) &&
            matchText((item as any).produto, produtoQuery) &&
            matchText((item as any).categoria, categoriaQuery) &&
            matchText((item as any).familia, familiaQuery) &&
            matchText((item as any).grupo_produto, grupoProdutoQuery)
        );
    }, [dateRange, records, filialQuery, fornecedorQuery, produtoQuery, categoriaQuery, familiaQuery, grupoProdutoQuery]);

    const kpiData = useMemo(() => {
        const totalRegistros = filteredData.length;
        const perdaTotalKg = filteredData.reduce((sum, item) => sum + item.perdaKg, 0);
        const perdaTotalCx = filteredData.reduce((sum, item) => sum + item.perdaCx, 0);
        const pesoProgramado = filteredData.reduce((sum, item) => sum + item.pesoLiquidoProgramado, 0);
        const pesoReal = filteredData.reduce((sum, item) => sum + item.pesoLiquidoReal, 0);
        const perdaPercentualMedia = pesoProgramado > 0 ? (perdaTotalKg / pesoProgramado) * 100 : 0;

        return {
            totalRegistros,
            perdaTotalKg,
            perdaTotalCx,
            pesoProgramado,
            pesoReal,
            perdaPercentualMedia
        };
    }, [filteredData]);

    const chartData = useMemo(() => {
        // Evolução da Perda
        const dailyLoss = filteredData.reduce((acc, item) => {
            const date = format(item.dataRegistro, 'yyyy-MM-dd');
            if (!acc[date]) {
                acc[date] = { date, perda_kg: 0 };
            }
            acc[date].perda_kg += item.perdaKg;
            return acc;
        }, {} as Record<string, { date: string, perda_kg: number }>);

        // Perda por Filial
        const lossByBranch = filteredData.reduce((acc, item) => {
            if (!acc[item.filial]) {
                acc[item.filial] = { name: item.filial, perda_kg: 0, volume: 0 };
            }
            acc[item.filial].perda_kg += item.perdaKg;
            acc[item.filial].volume += item.quantidadeRecebida;
            return acc;
        }, {} as Record<string, { name: string, perda_kg: number, volume: number }>);

        // Perda por Categoria (Top 10)
        const lossByCategory = filteredData.reduce((acc, item: any) => {
            const key = item.categoria || 'Sem categoria';
            if (!acc[key]) acc[key] = { name: key, perda_kg: 0 };
            acc[key].perda_kg += item.perdaKg || 0;
            return acc;
        }, {} as Record<string, { name: string, perda_kg: number }>);
        const topCategories = Object.values(lossByCategory)
            .sort((a,b) => b.perda_kg - a.perda_kg)
            .slice(0, 10);

        const topBranches = Object.values(lossByBranch)
            .sort((a,b) => b.perda_kg - a.perda_kg)
            .slice(0, 5);

        // Perda por Fornecedor (Top 10)
        const lossByFornecedor = filteredData.reduce((acc, item: any) => {
            const key = item.fornecedor || 'SEM FORNECEDOR';
            if (!acc[key]) acc[key] = { name: key, perda_kg: 0 };
            acc[key].perda_kg += item.perdaKg || 0;
            return acc;
        }, {} as Record<string, { name: string, perda_kg: number }>);
        const topFornecedores = Object.values(lossByFornecedor)
            .sort((a,b) => b.perda_kg - a.perda_kg)
            .slice(0, 10);

        // Perda por Produto (Top 10)
        const lossByProduto = filteredData.reduce((acc, item: any) => {
            const key = item.produto || 'SEM PRODUTO';
            if (!acc[key]) acc[key] = { name: key, perda_kg: 0 };
            acc[key].perda_kg += item.perdaKg || 0;
            return acc;
        }, {} as Record<string, { name: string, perda_kg: number }>);
        const topProdutos = Object.values(lossByProduto)
            .sort((a,b) => b.perda_kg - a.perda_kg)
            .slice(0, 10)
            .map(item => ({
                ...item,
                name: item.name.split(' ').filter(w => w !== '-').slice(0, 3).join(' ')
            }));

        return {
            dailyLoss: Object.values(dailyLoss).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            lossByBranch: Object.values(lossByBranch),
            topCategories,
            topBranches,
            topFornecedores,
            topProdutos
        }
    }, [filteredData]);

    const handleTabChange = (value: string) => {
        const now = new Date();
        switch (value) {
            case '7d': setDateRange({ from: subDays(now, 6), to: now }); break;
            case '30d': setDateRange({ from: subDays(now, 29), to: now }); break;
            case '90d': setDateRange({ from: subDays(now, 89), to: now }); break;
            default: setDateRange({ from: subDays(now, 29), to: now });
        }
    }

return (
    <PageContent 
        title="Dashboard" 
        subtitle="Visão geral dos registros e performance."
    >
        <div className="flex flex-col gap-4 w-full max-w-full overflow-hidden">

            {/* Header */}
            <div className="flex flex-col gap-3 w-full max-w-full 
                            sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">

                <Tabs defaultValue="30d" className="space-y-4" onValueChange={handleTabChange}>
                    <TabsList className="flex flex-wrap w-full max-w-full">
                        <TabsTrigger value="7d">7 Dias</TabsTrigger>
                        <TabsTrigger value="30d">30 Dias</TabsTrigger>
                        <TabsTrigger value="90d">90 Dias</TabsTrigger>
                    </TabsList>
                </Tabs>

                <DateRangePicker 
                    date={dateRange} 
                    onDateChange={setDateRange}
                    className="w-full sm:w-auto"
                />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 gap-2 w-full max-w-full 
                            sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">

                <Input className="w-full min-w-0" placeholder="Filial" value={filialQuery}
                    onChange={e => setFilialQuery(e.target.value)} />

                <Input className="w-full min-w-0" placeholder="Fornecedor" value={fornecedorQuery}
                    onChange={e => setFornecedorQuery(e.target.value)} />

                <Input className="w-full min-w-0" placeholder="Produto" value={produtoQuery}
                    onChange={e => setProdutoQuery(e.target.value)} />

                <Input className="w-full min-w-0" placeholder="Categoria" value={categoriaQuery}
                    onChange={e => setCategoriaQuery(e.target.value)} />

                <Input className="w-full min-w-0" placeholder="Família" value={familiaQuery}
                    onChange={e => setFamiliaQuery(e.target.value)} />

                <Input className="w-full min-w-0" placeholder="Grupo Produto" value={grupoProdutoQuery}
                    onChange={e => setGrupoProdutoQuery(e.target.value)} />
            </div>

            <div className="flex items-center justify-end">
                <Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>
            </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KpiCard title="Perda Média" value={`${kpiData.perdaPercentualMedia.toFixed(2)}%`} icon={<TrendingDown />} description="Média de perda no período" />
                    <KpiCard title="Perda Total (KG)" value={kpiData.perdaTotalKg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} icon={<Weight />} description={`${kpiData.totalRegistros} registros`} />
                    <KpiCard title="Perda Total (CX)" value={kpiData.perdaTotalCx.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} icon={<Boxes />} description="Equivalente em caixas" />
                    <KpiCard title="Peso Programado vs. Real" value={`${(kpiData.pesoProgramado / 1000).toFixed(1)}t / ${(kpiData.pesoReal / 1000).toFixed(1)}t`} icon={<Scale />} description="Total em toneladas" />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="lg:col-span-4">
                        <CardHeader>
                            <CardTitle>Evolução Diária da Perda (KG)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={chartData.dailyLoss}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), 'dd/MM')} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                                    <YAxis tick={{ fontSize: 11, fontWeight: 'bold' }} />
                                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} contentStyle={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <Line type="monotone" dataKey="perda_kg" name="Perda em KG" stroke="var(--color-primary)" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Top 10 Fornecedor x Perda (Kg)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart layout="vertical" data={chartData.topFornecedores} margin={{ left: 5, right: 30, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} contentStyle={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <Bar dataKey="perda_kg" name="Perda (KG)" fill="#ef4444" radius={[0, 4, 4, 0]}>
                                        <LabelList dataKey="perda_kg" position="right" formatter={(val: number) => val.toFixed(0)} style={{ fontSize: 10, fill: '#666', fontWeight: 'bold' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2 lg:col-span-7">
                        <CardHeader>
                            <CardTitle>Top 10 Produtos x Perda (Kg)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData.topProdutos} margin={{ left: 5, right: 30, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} />
                                    <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} height={110} />
                                    <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} contentStyle={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <Bar dataKey="perda_kg" name="Perda (KG)" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="perda_kg" position="top" formatter={(val: number) => val.toFixed(0)} style={{ fontSize: 10, fill: '#666', fontWeight: 'bold' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Novos gráficos: Top categorias e Top filiais por perda */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top 10 Perdas por Categoria (KG)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData.topCategories}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                                    <YAxis tick={{ fontSize: 11, fontWeight: 'bold' }} />
                                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} contentStyle={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <Bar dataKey="perda_kg" name="Perda (KG)" fill="var(--color-primary)">
                                        <LabelList dataKey="perda_kg" position="top" formatter={(val: number) => Number(val).toFixed(2)} style={{ fontWeight: 'bold' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Top 5 Filiais por Perda (KG)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData.topBranches}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                                    <YAxis tick={{ fontSize: 11, fontWeight: 'bold' }} />
                                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} contentStyle={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <Bar dataKey="perda_kg" name="Perda (KG)" fill="var(--color-primary)">
                                        <LabelList dataKey="perda_kg" position="top" formatter={(val: number) => Number(val).toFixed(2)} style={{ fontWeight: 'bold' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Últimos 30 registros */}
                <Card>
                    <CardHeader>
                        <CardTitle>Últimos 30 Registros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Data</th>
                                        <th className="text-left p-2">Filial</th>
                                        <th className="text-left p-2">Categoria</th>
                                        <th className="text-right p-2">Qtd. Recebida</th>
                                        <th className="text-right p-2">Qtd. Analisada</th>
                                        <th className="text-right p-2">Peso Analisado (KG)</th>
                                        <th className="text-right p-2">Peso Real (KG)</th>
                                        <th className="text-right p-2">Perda (KG)</th>
                                        <th className="text-right p-2">Perda (CX)</th>
                                        <th className="text-left p-2">Fornecedor</th>
                                        <th className="text-left p-2">NF</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.slice(0, 30).map((r, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="p-2">{format(r.dataRegistro, 'dd/MM/yyyy')}</td>
                                            <td className="p-2">{r.filial}</td>
                                            <td className="p-2">{(r as any).categoria ?? ''}</td>
                                            <td className="p-2 text-right">{r.quantidadeRecebida}</td>
                                            <td className="p-2 text-right">{r.quantidadeTabela}</td>
                  <td className="p-2 text-right">{r.pesoLiquidoAnalise.toFixed(2)}</td>
                  <td className="p-2 text-right">{r.pesoLiquidoReal.toFixed(2)}</td>
                  <td className="p-2 text-right">{r.perdaKg.toFixed(2)}</td>
                                            <td className="p-2 text-right">{r.perdaCx.toFixed(2)}</td>
                                            <td className="p-2">{(r as any).fornecedor ?? ''}</td>
                                            <td className="p-2">{(r as any).notaFiscal ?? ''}</td>
                                        </tr>
                                    ))}
                                    {filteredData.length === 0 && (
                                        <tr>
                                            <td className="p-2" colSpan={11}>Nenhum registro encontrado para os filtros selecionados.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Perda por Filial (KG)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData.lossByBranch}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tickFormatter={(str) => str.split(' ')[1]} tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} contentStyle={{ fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="perda_kg" name="Perda em KG" fill="var(--color-primary)">
                                    <LabelList dataKey="perda_kg" position="top" formatter={(val: number) => Number(val).toFixed(2)} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </PageContent>
    );
}

// Re-exporting a CSS variable for recharts to use
const style = document.createElement('style');
style.innerHTML = `
:root {
    --color-primary: hsl(var(--primary));
    --color-secondary: hsl(var(--secondary));
}
`;
document.head.appendChild(style);
