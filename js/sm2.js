/**
 * KoreanMemory - SM-2 间隔重复算法
 * 标准 SM-2 实现，用于动态调整复习间隔
 */

/**
 * 根据评分计算新的 SM-2 状态
 * @param {Object} record - 当前记录 { ease_factor, interval, repetitions }
 * @param {number} quality - 评分 0-5
 *   - 0: 完全忘记（Again）
 *   - 1-2: 记得但困难（Hard）
 *   - 3: 一般（Good）
 *   - 4-5: 简单（Easy）
 * @returns {Object} 新的 SM-2 状态
 */
function sm2Calc(record, quality) {
  let { ease_factor, interval, repetitions } = record;
  
  // 确保初始值
  if (!ease_factor || ease_factor < 1.3) ease_factor = 2.5;
  if (!interval || interval < 1) interval = 1;
  if (!repetitions || repetitions < 0) repetitions = 0;
  
  if (quality < 3) {
    // 忘记：重置
    repetitions = 0;
    interval = 1;
  } else {
    // 记住：按间隔递增
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
    repetitions++;
  }
  
  // 更新难度系数
  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;
  
  // 计算下次复习日期
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  
  return {
    ease_factor: Math.round(ease_factor * 100) / 100,
    interval,
    repetitions,
    next_review: nextReview.toISOString().split('T')[0]
  };
}

/**
 * 获取评分对应的间隔天数（用于显示）
 */
function getIntervalDays(quality, record) {
  const result = sm2Calc(record || { ease_factor: 2.5, interval: 1, repetitions: 0 }, quality);
  return result.interval;
}