import { PRESET_CONTACTS } from '../contacts.js';
import { formatTime, formatDateLabel } from '../utils/freebusy.js';

const contactMap = Object.fromEntries(PRESET_CONTACTS.map((c) => [c.email, c.name]));
const getName = (email) => contactMap[email] || email;

/**
 * 指定時段查詢結果：誰有空 / 誰有衝突
 */
export default function AvailabilityResult({ result, isLoading, queried }) {
  if (isLoading) {
    return (
      <div className="loading-state">
        <span className="spinner large" />
        <p>查詢中...</p>
      </div>
    );
  }
  if (!queried || !result) return null;

  const { free, busy, date, startTime, endTime, skipped = [] } = result;
  const dateLabel = formatDateLabel(date);

  function copyFreeList() {
    const names = free.map(getName).join('、');
    const text = `【有空人員】${dateLabel} ${startTime}–${endTime}\n${names}（共 ${free.length} 人）`;
    navigator.clipboard.writeText(text).then(() => alert('已複製！')).catch(() => alert('複製失敗'));
  }

  function copyFreeEmails() {
    navigator.clipboard.writeText(free.join('; ')).then(() => alert('Email 已複製！')).catch(() => alert('複製失敗'));
  }

  return (
    <div className="avail-result">
      {/* 摘要列 */}
      <div className="avail-summary">
        <span className="avail-time-badge">{dateLabel}　{startTime} – {endTime}</span>
        <span className="avail-stat free-stat">✅ 有空 {free.length} 人</span>
        <span className="avail-stat busy-stat">❌ 有衝突 {busy.length} 人</span>
      </div>

      {skipped.length > 0 && (
        <div className="avail-skipped">
          ⚠️ 以下 {skipped.length} 人日曆無法存取，未計入結果：
          {skipped.map(s => getName(s.email || s)).join('、')}
        </div>
      )}

      <div className="avail-columns">
        {/* 有空 */}
        <div className="avail-col">
          <div className="avail-col-header free-header">
            ✅ 有空（{free.length} 人）
            <div className="avail-copy-btns">
              <button className="btn-text" onClick={copyFreeList}>複製名單</button>
              <span className="divider">|</span>
              <button className="btn-text" onClick={copyFreeEmails}>複製 Email</button>
            </div>
          </div>
          {free.length === 0
            ? <p className="avail-empty">無人空閒</p>
            : free.map((email) => (
              <div key={email} className="avail-person free-person">
                <span className="person-name">{getName(email)}</span>
                <span className="person-email">{contactMap[email] ? email : ''}</span>
              </div>
            ))
          }
        </div>

        {/* 有衝突 */}
        <div className="avail-col">
          <div className="avail-col-header busy-header">
            ❌ 有衝突（{busy.length} 人）
          </div>
          {busy.length === 0
            ? <p className="avail-empty">無人有衝突</p>
            : busy.map(({ email, conflicts }) => (
              <div key={email} className="avail-person busy-person">
                <div className="person-name">{getName(email)}</div>
                <div className="conflict-times">
                  {conflicts.map((c, i) => (
                    <span key={i} className="conflict-badge">
                      {formatTime(new Date(c.start))}–{formatTime(new Date(c.end))}
                    </span>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
