import React from 'react';

const HireButton = ({ onHire, profit }) => {
  if (profit < 2000) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-md p-6 text-center">
        <h3 className="text-lg font-bold text-white mb-3">🎉 恭喜！可以招聘新员工了</h3>
        <p className="text-white/90 mb-4">招聘新员工需要 ¥500，但会提高工作效率</p>
        <button
          onClick={onHire}
          className="bg-white text-orange-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-md transition-colors duration-200"
        >
          💼 招聘新员工 (-¥500)
        </button>
      </div>
    </div>
  );
};

export default HireButton; 