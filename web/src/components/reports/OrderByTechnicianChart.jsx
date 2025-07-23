import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { apiService } from '../../services/api';

const OrdersByTechnicianChart = () => {
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    try {
      const response = await apiService.getOrdersByTechnician(startDate, endDate);
      const rawData = response.data || response;

      // Garante que é um objeto e não a resposta completa do Axios
      if (Array.isArray(rawData)) {
        setData(rawData);
      } else {
        const formatted = Object.entries(rawData).map(([name, value]) => ({
          name,
          value: Number(value) || 0,
        }));
        setData(formatted);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório por técnico', error);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl shadow-md mt-4">
      <h2 className="text-lg font-semibold mb-4">Ordens por Técnico</h2>

      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-sm">Data Inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Data Final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <button onClick={fetchReport} className="bg-blue-600 text-white px-4 py-2 rounded self-end">
          Filtrar
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(value) => `${value} ordens`} />
          <Bar dataKey="value" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrdersByTechnicianChart;
