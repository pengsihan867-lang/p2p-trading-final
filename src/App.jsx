import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatsBar from './components/StatsBar';
import TaskInput from './components/TaskInput';
import ResultDisplay from './components/ResultDisplay';
import HireButton from './components/HireButton';

function App() {
  const [profit, setProfit] = useState(1000);
  const [employees, setEmployees] = useState(1);
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 从 LocalStorage 加载数据
  useEffect(() => {
    const savedProfit = localStorage.getItem('xiangao_profit');
    const savedEmployees = localStorage.getItem('xiangao_employees');
    
    if (savedProfit) setProfit(parseInt(savedProfit));
    if (savedEmployees) setEmployees(parseInt(savedEmployees));
  }, []);

  // 保存数据到 LocalStorage
  const saveToLocalStorage = (newProfit, newEmployees) => {
    localStorage.setItem('xiangao_profit', newProfit.toString());
    localStorage.setItem('xiangao_employees', newEmployees.toString());
  };

  // 分配任务
  const handleAssignTask = async (task) => {
    setIsLoading(true);
    setResult('');
    
    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: task }]
        },
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const aiResult = response.data.choices[0].message.content;
      setResult(aiResult);
    } catch (error) {
      console.error('API调用失败:', error);
      setResult('抱歉，仙高员工暂时无法处理您的任务，请稍后再试。');
    } finally {
      setIsLoading(false);
    }
  };

  // 好评
  const handleGoodReview = () => {
    const newProfit = profit + 100;
    setProfit(newProfit);
    saveToLocalStorage(newProfit, employees);
    setResult('');
  };

  // 差评
  const handleBadReview = () => {
    const newProfit = Math.max(0, profit - 50);
    setProfit(newProfit);
    saveToLocalStorage(newProfit, employees);
    setResult('');
  };

  // 招聘新员工
  const handleHire = () => {
    if (profit >= 500) {
      const newProfit = profit - 500;
      const newEmployees = employees + 1;
      setProfit(newProfit);
      setEmployees(newEmployees);
      saveToLocalStorage(newProfit, newEmployees);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <StatsBar profit={profit} employees={employees} />
      <TaskInput onAssignTask={handleAssignTask} isLoading={isLoading} />
      <ResultDisplay 
        result={result} 
        isLoading={isLoading} 
        onGoodReview={handleGoodReview} 
        onBadReview={handleBadReview} 
      />
      <HireButton onHire={handleHire} profit={profit} />
    </div>
  );
}

export default App; 