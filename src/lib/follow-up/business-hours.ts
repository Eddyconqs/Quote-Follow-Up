import { addDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export interface BusinessHours {
  /** 0-23, inclusive start hour in company local time. */
  start: number;
  /** 1-24, exclusive end hour in company local time. */
  end: number;
  /** 0 (Sunday) - 6 (Saturday), the days follow-up messages may be sent. */
  days: number[];
}

export const DEFAULT_BUSINESS_HOURS: BusinessHours = { start: 9, end: 17, days: [1, 2, 3, 4, 5] };

export function parseBusinessHours(value: unknown): BusinessHours {
  if (
    value &&
    typeof value === "object" &&
    "start" in value &&
    "end" in value &&
    "days" in value &&
    Array.isArray((value as BusinessHours).days)
  ) {
    return value as BusinessHours;
  }
  return DEFAULT_BUSINESS_HOURS;
}

/**
 * Given a candidate UTC instant, returns the next instant that falls within the
 * company's business hours/days in its own time zone. If the candidate already
 * falls within a valid window, it is returned unchanged — this function only ever
 * pushes forward in time, never backward, so a requested delay is always honored.
 */
export function nextValidSendTime(candidate: Date, timeZone: string, businessHours: BusinessHours): Date {
  const hours = businessHours.days.length > 0 ? businessHours : DEFAULT_BUSINESS_HOURS;

  for (let offset = 0; offset < 8; offset++) {
    const zoned = toZonedTime(offset === 0 ? candidate : addDays(candidate, offset), timeZone);
    const dow = zoned.getDay();
    const hourOfDay = zoned.getHours() + zoned.getMinutes() / 60;

    if (!hours.days.includes(dow)) continue;

    if (offset === 0 && hourOfDay >= hours.start && hourOfDay < hours.end) {
      return candidate;
    }

    // Either a future day, or the same day but before opening — land at opening time.
    if (offset > 0 || hourOfDay < hours.start) {
      const local = new Date(zoned);
      local.setHours(hours.start, 0, 0, 0);
      return fromZonedTime(local, timeZone);
    }

    // Same day but past closing — try the next day.
  }

  // Fallback: should be unreachable given a non-empty `days` list, but avoids an infinite loop.
  return candidate;
}

/** Computes the send time for a follow-up step given when its clock starts and its configured delay. */
export function computeStepSendTime(
  from: Date,
  delayInDays: number,
  timeZone: string,
  businessHours: BusinessHours
): Date {
  const candidate = delayInDays > 0 ? addDays(from, delayInDays) : from;
  return nextValidSendTime(candidate, timeZone, businessHours);
}
