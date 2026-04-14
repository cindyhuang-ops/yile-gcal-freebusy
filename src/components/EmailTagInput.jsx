import { useState, useRef } from 'react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * F-01：Tag 形式輸入多人 Email
 * - Enter 或逗號新增 Tag
 * - 點 × 刪除
 * - 驗證 email 格式與重複
 */
export default function EmailTagInput({ emails, onChange }) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  function addEmail(raw) {
    const val = raw.trim().toLowerCase();
    if (!val) return;

    if (!EMAIL_REGEX.test(val)) {
      setError('格式不正確');
      return;
    }
    if (emails.includes(val)) {
      setError('已在清單中');
      return;
    }

    setError('');
    onChange([...emails, val]);
    setInputValue('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      // Backspace 刪除最後一個 Tag
      onChange(emails.slice(0, -1));
      setError('');
    }
  }

  function handleBlur() {
    if (inputValue.trim()) addEmail(inputValue);
  }

  function removeEmail(email) {
    onChange(emails.filter((e) => e !== email));
    setError('');
  }

  function handleChange(e) {
    const val = e.target.value;
    // 若貼上包含逗號，批次新增
    if (val.includes(',')) {
      const parts = val.split(',');
      const last = parts.pop();
      parts.forEach((p) => addEmail(p));
      setInputValue(last);
    } else {
      setInputValue(val);
      if (error) setError('');
    }
  }

  return (
    <div className="email-tag-input-wrapper">
      <label className="field-label">查詢對象</label>
      <div
        className={`tag-container ${error ? 'has-error' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {emails.map((email) => (
          <span key={email} className="tag">
            {email}
            <button
              type="button"
              className="tag-remove"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(email);
              }}
              aria-label={`移除 ${email}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="tag-input"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={emails.length === 0 ? '輸入 Email，按 Enter 新增' : ''}
          aria-label="輸入 Email"
        />
      </div>
      {error && <span className="field-error">{error}</span>}
      <span className="field-hint">按 Enter 或逗號新增，支援一次貼上多個（逗號分隔）</span>
    </div>
  );
}
