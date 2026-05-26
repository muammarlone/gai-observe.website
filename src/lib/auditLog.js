import { supabase } from './supabase.js';

const STORAGE_KEY = 'gai_audit_queue';

function getLocalQueue() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function appendLocalQueue(event) {
  try {
    const queue = getLocalQueue();
    queue.push(event);
    if (queue.length > 500) queue.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage unavailable — silently drop
  }
}

export async function logAuditEvent(eventType, payload = {}, bookId = 'pm_handbook') {
  const payloadStr = JSON.stringify(payload);
  const safePayload = payloadStr.length <= 8192 ? payload : { truncated: true, size: payloadStr.length };

  const event = {
    event_type: String(eventType).slice(0, 100),
    book_id: String(bookId).slice(0, 50),
    payload: safePayload,
    created_at: new Date().toISOString()
  };

  if (!supabase) {
    appendLocalQueue(event);
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  event.user_id = user?.id || null;
  event.user_email = user?.email || null;

  const { error } = await supabase.from('audit_events').insert(event);
  if (error) {
    appendLocalQueue(event);
  }
}

export async function flushAuditQueue() {
  if (!supabase) return;

  const queue = getLocalQueue();
  if (queue.length === 0) return;

  const validQueue = queue.filter(item =>
    typeof item === 'object' && item !== null &&
    typeof item.event_type === 'string' &&
    typeof item.book_id === 'string' &&
    typeof item.created_at === 'string' &&
    typeof item.payload === 'object'
  );
  if (validQueue.length === 0) {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return;
  }

  const { error } = await supabase.from('audit_events').insert(validQueue);
  if (!error) {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
}
