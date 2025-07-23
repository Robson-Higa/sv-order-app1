import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const GeneralOrdersChart = ({ data }) => {
  if (!data || !data.length) return null;

  return (
    <div className="w-full h-80 bg-white rounded-xl p-4 shadow">
      <h3 className="text-lg font-semibold mb-4">Ordens por Mês</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="total" fill="#3b82f6" name="Total de Ordens" />
          <Bar dataKey="completed" fill="#10b981" name="Concluídas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GeneralOrdersChart;
