// src/components/reports/ChartSkeleton.jsx
import React from 'react';

const ChartSkeleton = ({ title }) => {
  return (
    <div className="w-full h-80 bg-white rounded-xl p-4 shadow flex flex-col">
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
      <div className="flex-1 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );
};

export default ChartSkeleton;
