import React, { useState, useEffect } from 'react';
import { questions } from '../data/questions.js';
import { calculateScore, assignUniversity, shuffleQuestions } from '../utils/gameLogic.js';

const Game = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameQuestions, setGameQuestions] = useState([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [assignedUniversity, setAssignedUniversity] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // 初始化游戏
  useEffect(() => {
    const shuffledQuestions = shuffleQuestions(questions);
    setGameQuestions(shuffledQuestions);
  }, []);

  // 处理答案选择
  const handleAnswerSelect = (answer) => {
    if (selectedAnswer !== null) return; // 防止重复选择
    
    setSelectedAnswer(answer);
    const currentQuestion = gameQuestions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prev => prev + 5);
    }

    // 延迟显示下一题或结果
    setTimeout(() => {
      setSelectedAnswer(null);
      if (currentQuestionIndex < 19) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // 游戏结束
        const finalScore = score + (isCorrect ? 5 : 0);
        const university = assignUniversity(finalScore);
        setAssignedUniversity(university);
        setGameFinished(true);
      }
    }, 1000);
  };

  // 重新开始游戏
  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameFinished(false);
    setAssignedUniversity('');
    setSelectedAnswer(null);
    setShowResult(false);
    const shuffledQuestions = shuffleQuestions(questions);
    setGameQuestions(shuffledQuestions);
  };

  // 显示结果
  const showFinalResult = () => {
    setShowResult(true);
  };

  if (gameQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (gameFinished && showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">🎓</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">恭喜你被录取！</h1>
            <div className="text-xl font-semibold text-blue-600 mb-4">
              {assignedUniversity}
            </div>
            <div className="text-lg text-gray-600">
              最终得分：{score} 分
            </div>
          </div>
          <button
            onClick={restartGame}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 w-full"
          >
            重新考试
          </button>
        </div>
      </div>
    );
  }

  if (gameFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">📝</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">考试完成！</h1>
            <div className="text-xl text-gray-600 mb-6">
              你的最终得分：{score} 分
            </div>
          </div>
          <button
            onClick={showFinalResult}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 w-full"
          >
            查看录取结果
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = gameQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / 20) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 背景教室 */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-blue-200 opacity-50"></div>
      
      {/* 教室桌椅背景 */}
      <div className="absolute inset-0 grid grid-cols-5 gap-4 p-8 opacity-20">
        {Array.from({ length: 20 }).map((_, index) => (
          <div key={index} className="bg-gray-300 rounded-lg h-16 flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-400 rounded"></div>
          </div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 顶部进度条 */}
        <div className="bg-white shadow-lg p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                第 {currentQuestionIndex + 1} 题 / 20 题
              </span>
              <span className="text-sm font-medium text-gray-700">
                得分：{score} 分
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
            {/* 题目信息 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {currentQuestion.subject}
                </span>
                <span className="text-gray-500 text-sm">
                  每题 5 分
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* 选项 */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = selectedAnswer === optionLetter;
                const isCorrect = currentQuestion.correctAnswer === optionLetter;
                const showCorrect = selectedAnswer !== null;
                
                let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 font-medium";
                
                if (isSelected) {
                  if (isCorrect) {
                    buttonClass += " bg-green-100 border-green-500 text-green-800";
                  } else {
                    buttonClass += " bg-red-100 border-red-500 text-red-800";
                  }
                } else if (showCorrect && isCorrect) {
                  buttonClass += " bg-green-100 border-green-500 text-green-800";
                } else {
                  buttonClass += " bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(optionLetter)}
                    disabled={selectedAnswer !== null}
                    className={buttonClass}
                  >
                    <span className="inline-block w-8 h-8 bg-blue-600 text-white rounded-full text-center leading-8 mr-3 font-bold">
                      {optionLetter}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {/* 人物角色 */}
            <div className="mt-8 text-center">
              <div className="inline-block bg-blue-100 rounded-full p-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  吴
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">吴泽凯正在认真答题...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game; 