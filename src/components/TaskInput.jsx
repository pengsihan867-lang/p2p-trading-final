import React, { useState } from 'react';

const TaskInput = ({ onAssignTask, isLoading }) => {
  const [task, setTask] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (task.trim()) {
      onAssignTask(task.trim());
      setTask('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">分配任务给仙高员工</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-2">
              任务描述
            </label>
            <textarea
              id="task"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="例如：帮我写一封拜师帖"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="3"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!task.trim() || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-md transition-colors duration-200"
          >
            {isLoading ? '仙高思索中...' : '分配任务'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskInput; 