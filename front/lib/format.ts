// Fields that should always be parsed as JSON arrays/objects
const JSON_FIELDS = new Set([
  'emails', 'telephones', 'liens_externes', 'liensExternes',
  'interlocuteurs', 'score_details', 'scoreDetails',
  'notification_preferences', 'notificationPreferences',
  'dashboard_preferences', 'dashboardPreferences',
  'google_calendar_token', 'googleCalendarToken',
  'data', // notifications.data
]);

// Parse a value that might be a stringified JSON
function parseJsonField(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

// Converts Prisma camelCase fields to snake_case for API compatibility
export function toSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(toSnake);
  if (typeof obj !== 'object') return obj;
  // Handle Prisma Decimal
  if (typeof obj.toNumber === 'function') return obj.toNumber();

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (JSON_FIELDS.has(key) || JSON_FIELDS.has(snakeKey)) {
      result[snakeKey] = parseJsonField(value);
    } else {
      result[snakeKey] = toSnake(value);
    }
  }
  return result;
}

// Format a single record for API response (Prisma → snake_case)
export function formatRecord(record: any): any {
  return toSnake(record);
}

// Format for Laravel-style { data: ... } response
export function formatResponse(data: any) {
  return { data: Array.isArray(data) ? data.map(formatRecord) : formatRecord(data) };
}

// Parse decimal fields to numbers
export function parseDecimal(value: any): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}
