import { useState } from 'react';
import ContactPicker from './ContactPicker.jsx';

/**
 * 指定時段查詢表單
 * 輸入日期 + 起訖時間，選取要查的人，查詢誰有空
 */
export default function SlotQueryForm({ onQuery, isLoading }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]         = useState(today);
  const [startTime, setStart]   = useState('10:00');
  const [endTime, setEnd]        = useState('11:00');
  const [emails, setEmails]     = useState([]);
  const [errors, setErrors]     = useState({});

  function validate() {
    const errs = {};
    if (!date)              errs.date      = '請選擇日期';
    if (!startTime)         errs.startTime = '請選擇開始時間';
    if (!endTime)           errs.endTime   = '請選擇結束時間';
    else if (endTime <= startTime) errs.endTime = '結束時間必須晚於開始時間';
    if (emails.length < 1)  errs.emails    = '請至少選取一位查詢對象';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    // 組成 RFC3339
    const timeMin = `${date}T${startTime}:00+08:00`;
    const timeMax = `${date}T${endTime}:00+08:00`;
    onQuery({ emails, timeMin, timeMax, date, startTime, endTime });
  }

  return (
    <form className="query-config" onSubmit={handleSubmit} noValidate>
      <h2 className="section-title">指定時段</h2>

      <div className="form-row">
        <div className="form-group">
          <label className="field-label" htmlFor="sq-date">日期</label>
          <input
            id="sq-date"
            type="date"
            className={`field-input ${errors.date ? 'has-error' : ''}`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>

        <div className="form-group">
          <label className="field-label" htmlFor="sq-start">開始時間</label>
          <input
            id="sq-start"
            type="time"
            className={`field-input ${errors.startTime ? 'has-error' : ''}`}
            value={startTime}
            onChange={(e) => setStart(e.target.value)}
          />
          {errors.startTime && <span className="field-error">{errors.startTime}</span>}
        </div>

        <div className="form-group">
          <label className="field-label" htmlFor="sq-end">結束時間</label>
          <input
            id="sq-end"
            type="time"
            className={`field-input ${errors.endTime ? 'has-error' : ''}`}
            value={endTime}
            onChange={(e) => setEnd(e.target.value)}
          />
          {errors.endTime && <span className="field-error">{errors.endTime}</span>}
        </div>
      </div>

      {/* 常用人員選取 */}
      <ContactPicker selectedEmails={emails} onChange={setEmails} />
      {errors.emails && <div className="alert alert-error" style={{marginTop: '8px'}}>{errors.emails}</div>}

      <button type="submit" className="btn-primary" disabled={isLoading} style={{marginTop: '16px'}}>
        {isLoading
          ? <span className="btn-loading"><span className="spinner" />查詢中...</span>
          : '查詢誰有空'}
      </button>
    </form>
  );
}
