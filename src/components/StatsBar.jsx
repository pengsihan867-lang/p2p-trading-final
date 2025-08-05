import React from 'react';

const StatsBar = ({ profit, employees }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center">
        <div className="text-2xl font-bold mb-2 sm:mb-0">
          《模拟仙高》
        </div>
        <div className="flex flex-col sm:flex-row gap-4 text-center sm:text-left">
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <div className="text-sm opacity-90">当前利润</div>
            <div className="text-xl font-bold">¥{profit.toLocaleString()}</div>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <div className="text-sm opacity-90">员工数量</div>
            <div className="text-xl font-bold">{employees} 人</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar; 