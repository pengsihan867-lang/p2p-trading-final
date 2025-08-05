import { universities985, universities211, shanghaiSecondTier } from '../data/universities.js';

// 计算分数
export const calculateScore = (correctAnswers) => {
  return correctAnswers * 5; // 每题5分
};

// 根据分数分配学校
export const assignUniversity = (score) => {
  if (score === 100) {
    return "北京大学";
  } else if (score >= 80 && score <= 95) {
    // 从985大学中随机选择一所（排除北京大学）
    const available985 = universities985.filter(uni => uni !== "北京大学");
    const randomIndex = Math.floor(Math.random() * available985.length);
    return available985[randomIndex];
  } else if (score >= 60 && score <= 75) {
    // 从211大学中随机选择一所（排除985大学）
    const available211 = universities211.filter(uni => !universities985.includes(uni));
    const randomIndex = Math.floor(Math.random() * available211.length);
    return available211[randomIndex];
  } else if (score >= 50 && score <= 55) {
    return "上海师范大学";
  } else if (score >= 40 && score <= 45) {
    // 从上海二本院校中随机选择一所
    const randomIndex = Math.floor(Math.random() * shanghaiSecondTier.length);
    return shanghaiSecondTier[randomIndex];
  } else if (score === 0) {
    return "大专";
  } else {
    // 其他分数段，随机分配
    const allUniversities = [...universities211, ...shanghaiSecondTier, "大专"];
    const randomIndex = Math.floor(Math.random() * allUniversities.length);
    return allUniversities[randomIndex];
  }
};

// 随机打乱题目顺序
export const shuffleQuestions = (questions) => {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 20); // 只取前20题
}; 