/**
 * Google Calendar Freebusy API 呼叫（支援自動分批）
 */

import { FREEBUSY_ENDPOINT, TIMEZONE } from '../config.js';
import { getValidAccessToken, refreshAccessToken } from './auth.js';

// Google Workspace 每次查詢上限（保守設 20，避免 tooManyCalendarsRequested）
const BATCH_SIZE = 20;

/**
 * 查詢多人的忙碌時段（自動分批，每批 BATCH_SIZE 人）
 *
 * @param {{ emails, timeMin, timeMax }} params
 * @returns {{ calendars: Object, skipped: Array<{email, errors}> }}
 */
export async function queryFreebusy({ emails, timeMin, timeMax }) {
  // 切分成多批
  const batches = [];
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    batches.push(emails.slice(i, i + BATCH_SIZE));
  }

  const calendars = {};
  const skipped   = [];

  for (const batch of batches) {
    const result = await fetchBatch({ emails: batch, timeMin, timeMax });
    Object.assign(calendars, result.calendars);
    skipped.push(...result.skipped);
  }

  return { calendars, skipped };
}

/**
 * 單批查詢（內部使用）
 */
async function fetchBatch({ emails, timeMin, timeMax }) {
  const accessToken = await getValidAccessToken();

  const body = {
    timeMin,
    timeMax,
    timeZone: TIMEZONE,
    items: emails.map((id) => ({ id })),
  };

  let response = await fetch(FREEBUSY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  // 401：自動 refresh token 後重試
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    response = await fetch(FREEBUSY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
      },
      body: JSON.stringify(body),
    });
  }

  if (response.status === 429) {
    throw new Error('查詢次數達上限，請稍後再試');
  }
  if (!response.ok) {
    throw new Error(`API 請求失敗（HTTP ${response.status}），請稍後再試`);
  }

  const data = await response.json();

  const calendars = {};
  const skipped   = [];

  for (const email of emails) {
    const cal = data.calendars?.[email];
    if (cal?.errors?.length) {
      console.warn(`[Freebusy] 無法取得 ${email}:`, cal.errors);
      skipped.push({ email, errors: cal.errors });
    } else if (cal) {
      calendars[email] = cal;
    }
  }

  return { calendars, skipped };
}
