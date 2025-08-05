import React from 'react';

const ResultDisplay = ({ result, isLoading, onGoodReview, onBadReview }) => {
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <div className="thinking-animation text-2xl">🤔</div>
            <div className="thinking-animation text-lg font-medium">仙高思索中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">仙高员工成果</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-gray-700 whitespace-pre-wrap">{result}</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onGoodReview}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md transition-colors duration-200"
          >
            👍 好评 (+¥100)
          </button>
          <button
            onClick={onBadReview}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-md transition-colors duration-200"
          >
            👎 差评 (-¥50)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay; 