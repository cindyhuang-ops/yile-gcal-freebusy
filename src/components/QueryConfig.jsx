import { useState } from 'react';

/**
 * F-02：查詢條件設定
 * - 開始/結束日期
 * - 工作時段起迄（預設 09:00–18:00）
 * - 最短空閒分鐘數（預設 30，最小 15）
 * - 驗證規則依規格 4.2
 */
export default function QueryConfig({ onQuery, isLoading, emailCount }) {
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextWeek);
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [minDuration, setMinDuration] = useState(30);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};

    if (emailCount < 1) {
      errs.emails = '請至少輸入一位查詢對象';
    }
    if (!startDate) {
      errs.startDate = '請選擇開始日期';
    }
    if (!endDate) {
      errs.endDate = '請選擇結束日期';
    } else if (startDate && endDate < startDate) {
      errs.endDate = '結束日期不可早於開始日期';
    }
    if (!Number.isInteger(Number(minDuration)) || Number(minDuration) < 15) {
      errs.minDuration = '最短空閒時間至少 15 分鐘';
    }
    if (workEnd <= workStart) {
      errs.workEnd = '下班時間必須晚於上班時間';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onQuery({ startDate, endDate, workStart, workEnd, minDuration: Number(minDuration) });
  }

  return (
    <form className="query-config" onSubmit={handleSubmit} noValidate>
      <h2 className="section-title">查詢條件</h2>

      <div className="form-row">
        <div className="form-group">
          <label className="field-label" htmlFor="startDate">開始日期</label>
          <input
            id="startDate"
            type="date"
            className={`field-input ${errors.startDate ? 'has-error' : ''}`}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          {errors.startDate && <span className="field-error">{errors.startDate}</span>}
        </div>

        <div className="form-group">
          <label className="field-label" htmlFor="endDate">結束日期</label>
          <input
            id="endDate"
            type="date"
            className={`field-input ${errors.endDate ? 'has-error' : ''}`}
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {errors.endDate && <span className="field-error">{errors.endDate}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="field-label" htmlFor="workStart">上班時間</label>
          <input
            id="workStart"
            type="time"
            className="field-input"
            value={workStart}
            onChange={(e) => setWorkStart(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="field-label" htmlFor="workEnd">下班時間</label>
          <input
            id="workEnd"
            type="time"
            className={`field-input ${errors.workEnd ? 'has-error' : ''}`}
            value={workEnd}
            onChange={(e) => setWorkEnd(e.target.value)}
          />
          {errors.workEnd && <span className="field-error">{errors.workEnd}</span>}
        </div>

        <div className="form-group">
          <label className="field-label" htmlFor="minDuration">最短空閒（分鐘）</label>
          <input
            id="minDuration"
            type="number"
            className={`field-input ${errors.minDuration ? 'has-error' : ''}`}
            value={minDuration}
            min={15}
            step={5}
            onChange={(e) => setMinDuration(e.target.value)}
          />
          {errors.minDuration && <span className="field-error">{errors.minDuration}</span>}
        </div>
      </div>

      {errors.emails && (
        <div className="alert alert-error">{errors.emails}</div>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="btn-loading">
            <span className="spinner" />
            查詢中...
          </span>
        ) : (
          '查詢共同空閒時段'
        )}
      </button>
    </form>
  );
}
