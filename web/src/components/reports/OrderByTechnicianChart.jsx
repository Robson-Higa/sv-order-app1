import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#10b981', '#ef4444'];

const GeneralOrdersChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="w-full h-80 bg-white rounded-xl p-4 shadow flex items-center justify-center text-gray-400">
        Carregando gráfico...
      </div>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="w-full h-80 bg-white rounded-xl p-4 shadow flex flex-col items-center justify-center text-gray-500">
        <p>Nenhum dado disponível</p>
      </div>
    );
  }

  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="w-full h-80 bg-white rounded-xl p-4 shadow">
      <h3 className="text-lg font-semibold mb-4">Distribuição por Status</h3>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => `${val} ordens`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GeneralOrdersChart;
