import React, { useState } from 'react';
import Game from './components/Game';

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setGameStarted(true);
  };

  if (gameStarted) {
    return <Game />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            吴泽凯高考模拟器
          </h1>
          <p className="text-gray-600 mb-4">
            七宝中学教室里的高考模拟考试
          </p>
        </div>

        <div className="mb-8 text-left bg-blue-50 rounded-lg p-4">
          <h2 className="font-semibold text-blue-800 mb-2">游戏规则：</h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 总共 20 道题目（地理 + 政治）</li>
            <li>• 每题 5 分，满分 100 分</li>
            <li>• 根据得分分配不同层次的大学</li>
            <li>• 100分 → 北京大学</li>
            <li>• 80-95分 → 985大学</li>
            <li>• 60-75分 → 211大学</li>
            <li>• 50-55分 → 上海师范大学</li>
            <li>• 40-45分 → 上海二本院校</li>
            <li>• 0分 → 大专</li>
          </ul>
        </div>

        <button
          onClick={startGame}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 w-full text-lg"
        >
          开始考试
        </button>

        <div className="mt-6 text-center">
          <div className="inline-block bg-blue-100 rounded-full p-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              吴
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">吴泽凯正在等待考试开始...</p>
        </div>
      </div>
    </div>
  );
}

export default App;
