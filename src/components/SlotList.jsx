import { formatTime, formatDateLabel, formatDuration } from '../utils/freebusy.js';

/**
 * F-05：依日期分組顯示共同空閒時段
 * 點擊時段卡片 → 顯示「誰有空」詳細面板
 */
export default function SlotList({ results, isLoading, queried, onSlotClick }) {
  if (isLoading) {
    return (
      <div className="slot-list">
        <div className="loading-state">
          <span className="spinner large" />
          <p>正在查詢忙碌時段...</p>
        </div>
      </div>
    );
  }

  if (!queried) return null;

  if (results.length === 0) {
    return (
      <div className="slot-list">
        <div className="empty-state">
          <p className="empty-icon">📅</p>
          <p>該期間內無共同空閒時段</p>
          <p className="empty-hint">請調整日期範圍或縮短最短空閒時間後重新查詢</p>
        </div>
      </div>
    );
  }

  const totalSlots = results.reduce((sum, d) => sum + d.slots.length, 0);

  return (
    <div className="slot-list">
      <div className="result-header">
        <h2 className="section-title">共同空閒時段</h2>
        <span className="result-count">共 {totalSlots} 個時段</span>
      </div>
      <p className="slot-hint">點擊時段可查看誰有空 👆</p>

      {results.map(({ date, slots }) => (
        <div key={date} className="date-group">
          <h3 className="date-label">{formatDateLabel(date)}</h3>
          <div className="slot-cards">
            {slots.map((slot, i) => (
              <button
                key={i}
                type="button"
                className="slot-card clickable"
                onClick={() => onSlotClick({ slot, date })}
              >
                <div className="slot-time">
                  {formatTime(slot.start)} – {formatTime(slot.end)}
                </div>
                <div className="slot-duration">{formatDuration(slot.durationMin)}</div>
                <div className="slot-cta">查看誰有空 →</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
