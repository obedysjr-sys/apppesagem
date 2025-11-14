import * as React from 'react';
import { useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, format, startOfDay, subDays } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Box, Boxes, CalendarClock, TrendingDown, TrendingUp, Weight, Scale } from 'lucide-react';

import { PageContent } from "@/components/layout/page-content";
import { RegistroPeso } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';

// Sem dados simulados: registros iniciam vazios
const mockData: RegistroPeso[] = [];

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

    const filteredData = useMemo(() => {
        if (!dateRange?.from) return [];
        const startDate = startOfDay(dateRange.from);
        const endDate = dateRange.to ? startOfDay(addDays(dateRange.to, 1)) : startOfDay(addDays(startDate, 1));
        
        return mockData.filter(item => {
            const itemDate = startOfDay(item.dataRegistro);
            return itemDate >= startDate && itemDate < endDate;
        });
    }, [dateRange]);

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

        return {
            dailyLoss: Object.values(dailyLoss).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            lossByBranch: Object.values(lossByBranch),
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
        <PageContent title="Dashboard" subtitle="Visão geral dos registros e performance.">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Tabs defaultValue="30d" className="space-y-4" onValueChange={handleTabChange}>
                        <TabsList>
                            <TabsTrigger value="7d">7 Dias</TabsTrigger>
                            <TabsTrigger value="30d">30 Dias</TabsTrigger>
                            <TabsTrigger value="90d">90 Dias</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
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
                                    <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), 'dd/MM')} />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="perda_kg" name="Perda em KG" stroke="var(--color-primary)" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Participação das Filiais no Volume</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie data={chartData.lossByBranch} dataKey="volume" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ name, percent }) => `${name.split(' ')[1]}: ${(percent * 100).toFixed(0)}%`}>
                                        {chartData.lossByBranch.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${value.toLocaleString('pt-BR')} caixas`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                 <Card>
                    <CardHeader>
                        <CardTitle>Perda por Filial (KG)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData.lossByBranch}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tickFormatter={(str) => str.split(' ')[1]} />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} />
                                <Legend />
                                <Bar dataKey="perda_kg" name="Perda em KG" fill="var(--color-secondary)" />
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
