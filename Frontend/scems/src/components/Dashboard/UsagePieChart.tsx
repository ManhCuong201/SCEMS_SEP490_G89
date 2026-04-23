import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface UsagePieChartProps {
    data: { name: string; value: number }[];
    title: string;
    unit?: string;
}

export const UsagePieChart: React.FC<UsagePieChartProps> = ({ data, title, unit = 'giờ' }) => {
    const chartData = {
        labels: data.map(item => item.name),
        datasets: [
            {
                data: data.map(item => item.value),
                backgroundColor: [
                    '#3b82f6', // blue
                    '#10b981', // green
                    '#f59e0b', // yellow
                    '#ef4444', // red
                    '#8b5cf6', // purple
                    '#ec4899', // pink
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 20,
                    font: {
                        size: 12
                    }
                }
            },
            title: {
                display: true,
                text: title,
                font: {
                    size: 16,
                    weight: 'bold' as const
                }
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        return `${label}: ${value} ${unit}`;
                    }
                }
            }
        },
    };

    return (
        <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {data.length > 0 ? (
                <div style={{ flex: 1, position: 'relative' }}>
                    <Pie data={chartData} options={options} />
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)' }}>
                    Không có dữ liệu cho khoảng thời gian này
                </div>
            )}
        </div>
    );
};
