import { NextRequest, NextResponse } from "next/server";
import { processDueEnrollments } from "@/lib/follow-up/engine";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // No secret configured (local dev) — allow.
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Scheduler tick endpoint, invoked by Vercel Cron (see vercel.json) on a
 * schedule, or manually for local testing. Vercel automatically sends
 * `Authorization: Bearer $CRON_SECRET` on scheduled invocations.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await processDueEnrollments();
  return NextResponse.json({ processed: results.length, results });
}

/** Manual/external trigger, e.g. from scripts/process-follow-ups.ts or another scheduler. */
export async function POST(request: NextRequest) {
  return GET(request);
}
