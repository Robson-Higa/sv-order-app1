// src/components/reports/GeneralOrdersChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const GeneralOrdersChart = ({ data }) => {
  if (!data || data.length === 0) return <p>Nenhum dado para exibir.</p>;

  const chartData = Array.isArray(data)
    ? data
    : Object.entries(data).map(([status, value]) => ({ name: status, value }));

  return (
    <div className="w-full h-80 bg-white rounded-xl p-4 shadow">
      <h3 className="text-lg font-semibold mb-4">Ordens por Status</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GeneralOrdersChart;
