import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

interface UsageBarChartProps {
    data: { name: string; value: number }[];
    title: string;
}

export const UsageBarChart: React.FC<UsageBarChartProps> = ({ data, title }) => {
    const chartData = {
        labels: data.map(item => item.name),
        datasets: [
            {
                label: 'Số giờ sử dụng',
                data: data.map(item => item.value),
                backgroundColor: '#3b82f6',
                borderRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: title,
                font: {
                    size: 16,
                    weight: 'bold' as const
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Giờ'
                }
            }
        }
    };

    return (
        <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {data.length > 0 ? (
                <div style={{ flex: 1, position: 'relative' }}>
                    <Bar data={chartData} options={options} />
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)' }}>
                    Không có dữ liệu
                </div>
            )}
        </div>
    );
};
