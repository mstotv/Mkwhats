/**
 * Helper to convert a local date-time string (e.g. "2026-08-30 15:00")
 * in a specific IANA timezone (e.g. "Asia/Baghdad") to an accurate UTC Date object.
 */
export function parseLocalDateTimeToUtc(
  dateTimeStr: string,
  timeZone = 'Asia/Baghdad'
): Date | null {
  try {
    const cleaned = dateTimeStr.trim().replace('T', ' ');
    // Match YYYY-MM-DD HH:mm or YYYY-MM-DD HH:mm:ss
    const match = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);

    if (!match) {
      // Fallback standard parse
      const d = new Date(dateTimeStr);
      return isNaN(d.getTime()) ? null : d;
    }

    const [, yearStr, monthStr, dayStr, hourStr, minStr, secStr] = match;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);
    const second = secStr ? parseInt(secStr, 10) : 0;

    // Use Intl to find the timezone offset accurately
    // We create an approximate UTC date and then adjust for timezone offset
    const approxUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(approxUtc);
    const partObj: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') {
        partObj[p.type] = parseInt(p.value, 10);
      }
    }

    const tzHour = (partObj.hour === 24 ? 0 : partObj.hour) || 0;
    const tzDate = new Date(
      Date.UTC(
        partObj.year || year,
        (partObj.month || month) - 1,
        partObj.day || day,
        tzHour,
        partObj.minute || minute,
        partObj.second || second
      )
    );

    // Difference between tz date and approxUtc is the offset
    const offsetMs = tzDate.getTime() - approxUtc.getTime();

    // The true UTC time is approxUtc - offsetMs
    return new Date(approxUtc.getTime() - offsetMs);
  } catch (err) {
    console.error('[timezone-helper] Error parsing date time:', err);
    const d = new Date(dateTimeStr);
    return isNaN(d.getTime()) ? null : d;
  }
}
