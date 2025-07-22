// src/components/reports/OrdersByEstablishmentChart.jsx

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const OrdersByEstablishmentChart = ({ data }) => {
  if (!data) return null;

  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="w-full h-80 bg-white rounded-xl p-4 shadow">
      <h3 className="text-lg font-semibold mb-4">Ordens por Estabelecimento</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#6366F1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrdersByEstablishmentChart;
