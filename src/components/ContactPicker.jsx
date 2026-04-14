import { PRESET_CONTACTS } from '../contacts.js';

/**
 * 常用人員快速選取面板
 * - 點擊姓名 chip 即可加入 / 移除查詢清單
 * - 全選 / 全部清除
 */
export default function ContactPicker({ selectedEmails, onChange }) {
  const allEmails = PRESET_CONTACTS.map((c) => c.email);
  const selectedSet = new Set(selectedEmails);

  function toggle(email) {
    if (selectedSet.has(email)) {
      onChange(selectedEmails.filter((e) => e !== email));
    } else {
      onChange([...selectedEmails, email]);
    }
  }

  function selectAll() {
    // 加入尚未在清單中的人
    const merged = [...selectedEmails];
    for (const email of allEmails) {
      if (!selectedSet.has(email)) merged.push(email);
    }
    onChange(merged);
  }

  function clearAll() {
    // 移除所有常用人員（保留使用者手動輸入的）
    onChange(selectedEmails.filter((e) => !allEmails.includes(e)));
  }

  const selectedCount = PRESET_CONTACTS.filter((c) => selectedSet.has(c.email)).length;

  return (
    <div className="contact-picker">
      <div className="contact-picker-header">
        <span className="field-label">
          常用人員
          {selectedCount > 0 && (
            <span className="contact-count">已選 {selectedCount} 人</span>
          )}
        </span>
        <div className="contact-actions">
          <button type="button" className="btn-text" onClick={selectAll}>全選</button>
          <span className="divider">|</span>
          <button type="button" className="btn-text btn-text-muted" onClick={clearAll}>全部清除</button>
        </div>
      </div>

      <div className="contact-chips">
        {PRESET_CONTACTS.map((contact) => {
          const isSelected = selectedSet.has(contact.email);
          return (
            <button
              key={contact.email}
              type="button"
              className={`contact-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => toggle(contact.email)}
              title={contact.email}
            >
              {contact.name}
              {isSelected && <span className="chip-check">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
