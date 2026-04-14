import { PRESET_CONTACTS } from '../contacts.js';
import { formatTime, formatDateLabel, formatDuration } from '../utils/freebusy.js';

/**
 * 點選空檔後，顯示「誰有空」的詳細面板
 */
export default function SlotDetail({ slot, date, emails, onClose }) {
  if (!slot) return null;

  // 將 email 對應到姓名（有在常用名單就顯示姓名，否則顯示 email）
  const contactMap = Object.fromEntries(PRESET_CONTACTS.map((c) => [c.email, c.name]));
  const attendees = emails.map((email) => ({
    name: contactMap[email] || email,
    email,
  }));

  const timeStr = `${formatTime(slot.start)} – ${formatTime(slot.end)}`;
  const dateLabel = formatDateLabel(date);
  const durationStr = formatDuration(slot.durationMin);

  // 複製為純文字（適合貼到 Teams / Email）
  function copyText() {
    const nameList = attendees.map((a) => a.name).join('、');
    const text = `【空閒時段】${dateLabel} ${timeStr}（${durationStr}）\n有空人員（${attendees.length} 人）：${nameList}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('已複製到剪貼簿！');
    }).catch(() => {
      alert('複製失敗，請手動選取文字複製。');
    });
  }

  // 複製 Email 清單（適合直接貼到會議邀請收件人）
  function copyEmails() {
    navigator.clipboard.writeText(emails.join('; ')).then(() => {
      alert('Email 清單已複製！');
    }).catch(() => {
      alert('複製失敗，請手動選取文字複製。');
    });
  }

  return (
    <div className="slot-detail-overlay" onClick={onClose}>
      <div className="slot-detail-panel" onClick={(e) => e.stopPropagation()}>

        {/* 標題列 */}
        <div className="detail-header">
          <div>
            <div className="detail-date">{dateLabel}</div>
            <div className="detail-time">{timeStr}</div>
            <div className="detail-duration">{durationStr}</div>
          </div>
          <button className="detail-close" onClick={onClose} aria-label="關閉">×</button>
        </div>

        {/* 人員清單 */}
        <div className="detail-body">
          <div className="detail-section-title">
            ✅ 以下 {attendees.length} 位於此時段均有空
          </div>
          <div className="detail-attendees">
            {attendees.map(({ name, email }) => (
              <div key={email} className="detail-attendee">
                <span className="attendee-name">{name}</span>
                {contactMap[email] && (
                  <span className="attendee-email">{email}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 複製按鈕 */}
        <div className="detail-footer">
          <button className="btn-copy" onClick={copyText}>
            📋 複製時段資訊
          </button>
          <button className="btn-copy btn-copy-secondary" onClick={copyEmails}>
            ✉️ 複製 Email 清單
          </button>
        </div>

      </div>
    </div>
  );
}
