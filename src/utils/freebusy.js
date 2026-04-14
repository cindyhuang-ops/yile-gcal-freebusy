/**
 * 共同空閒時段計算演算法
 * 依規格 4.3 實作
 */

import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { addDays, getDay, isWeekend } from 'date-fns';
import { TIMEZONE } from '../config.js';

/**
 * 合併重疊與相鄰的區間
 * e.g. [{start:10, end:11}, {start:10.5, end:12}] → [{start:10, end:12}]
 * @param {Array<{start: number, end: number}>} intervals - Unix 毫秒時間戳
 * @returns {Array<{start: number, end: number}>}
 */
export function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].start <= last.end) {
      last.end = Math.max(last.end, sorted[i].end);
    } else {
      merged.push({ ...sorted[i] });
    }
  }
  return merged;
}

/**
 * 計算所有人的共同空閒時段
 *
 * @param {Object} calendars - Freebusy API 回傳的 calendars 物件
 * @param {Object} options
 * @param {string} options.startDate - 'YYYY-MM-DD'
 * @param {string} options.endDate   - 'YYYY-MM-DD'
 * @param {string} options.workStart - 'HH:mm'（e.g. '09:00'）
 * @param {string} options.workEnd   - 'HH:mm'（e.g. '18:00'）
 * @param {number} options.minDuration - 最短空閒分鐘數
 * @returns {Array<{date: string, slots: Array<{start: Date, end: Date, durationMin: number}>}>}
 */
export function computeFreeSlots(calendars, { startDate, endDate, workStart, workEnd, minDuration }) {
  // 1. 收集所有人的忙碌區間（轉為毫秒時間戳）
  const allBusy = [];
  for (const cal of Object.values(calendars)) {
    for (const { start, end } of cal.busy || []) {
      allBusy.push({
        start: new Date(start).getTime(),
        end: new Date(end).getTime(),
      });
    }
  }

  // 2. 合併忙碌區間
  const busyUnion = mergeIntervals(allBusy);

  // 3. 逐天計算空閒
  const results = [];
  const [startY, startM, startD] = startDate.split('-').map(Number);
  const [endY, endM, endD] = endDate.split('-').map(Number);
  let current = new Date(startY, startM - 1, startD);
  const last = new Date(endY, endM - 1, endD);

  while (current <= last) {
    // 跳過週末（0=週日, 6=週六）
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      const dateStr = formatDateStr(current);
      const [wsh, wsm] = workStart.split(':').map(Number);
      const [weh, wem] = workEnd.split(':').map(Number);

      // 工作時段起迄（Asia/Taipei 轉 UTC）
      const workStartTs = fromZonedTime(
        new Date(current.getFullYear(), current.getMonth(), current.getDate(), wsh, wsm, 0),
        TIMEZONE
      ).getTime();
      const workEndTs = fromZonedTime(
        new Date(current.getFullYear(), current.getMonth(), current.getDate(), weh, wem, 0),
        TIMEZONE
      ).getTime();

      // 找出與本日工作時段重疊的忙碌區間
      const dayBusy = busyUnion.filter(
        (b) => b.end > workStartTs && b.start < workEndTs
      );

      // Pointer 掃描，收集空隙
      const slots = [];
      let pointer = workStartTs;

      for (const busy of dayBusy) {
        const gapStart = pointer;
        const gapEnd = Math.min(busy.start, workEndTs);

        if (gapEnd > gapStart) {
          const durationMin = Math.round((gapEnd - gapStart) / 60000);
          if (durationMin >= minDuration) {
            slots.push({
              start: new Date(gapStart),
              end: new Date(gapEnd),
              durationMin,
            });
          }
        }
        pointer = Math.max(pointer, Math.min(busy.end, workEndTs));
      }

      // 最後一段空閒（最後一個忙碌區間之後到下班）
      if (pointer < workEndTs) {
        const durationMin = Math.round((workEndTs - pointer) / 60000);
        if (durationMin >= minDuration) {
          slots.push({
            start: new Date(pointer),
            end: new Date(workEndTs),
            durationMin,
          });
        }
      }

      if (slots.length > 0) {
        results.push({ date: dateStr, slots });
      }
    }

    current = addDays(current, 1);
  }

  return results;
}

/**
 * 格式化日期為 'YYYY-MM-DD'
 */
function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 將時間格式化為 Asia/Taipei 的 HH:mm 字串
 */
export function formatTime(date) {
  return format(toZonedTime(date, TIMEZONE), 'HH:mm', { timeZone: TIMEZONE });
}

/**
 * 將日期格式化為繁中日期字串（e.g. '4月14日（一）'）
 */
export function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${m}月${d}日（${days[date.getDay()]}）`;
}

/**
 * 將持續時間格式化為易讀字串
 */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} 分鐘`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} 小時 ${m} 分鐘` : `${h} 小時`;
}

/**
 * 指定時段查詢：判斷每個人是否有空
 *
 * @param {Object} calendars - Freebusy API 回傳的 calendars 物件
 * @param {string} timeMin   - 查詢起始時間（RFC3339）
 * @param {string} timeMax   - 查詢結束時間（RFC3339）
 * @returns {{ free: string[], busy: Array<{email, conflicts}> }}
 *   free: 有空的 email 陣列
 *   busy: 有衝突的 { email, conflicts: [{start, end}] } 陣列
 */
export function checkAvailability(calendars, timeMin, timeMax) {
  const slotStart = new Date(timeMin).getTime();
  const slotEnd   = new Date(timeMax).getTime();

  const free = [];
  const busy = [];

  for (const [email, cal] of Object.entries(calendars)) {
    // 找出與查詢時段重疊的忙碌區間
    const conflicts = (cal.busy || []).filter((b) => {
      const bs = new Date(b.start).getTime();
      const be = new Date(b.end).getTime();
      return bs < slotEnd && be > slotStart; // 有重疊
    });

    if (conflicts.length === 0) {
      free.push(email);
    } else {
      busy.push({ email, conflicts });
    }
  }

  return { free, busy };
}
