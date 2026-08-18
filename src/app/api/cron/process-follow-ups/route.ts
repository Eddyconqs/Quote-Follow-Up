import { NextRequest, NextResponse } from "next/server";
import { processDueEnrollments } from "@/lib/follow-up/engine";

/**
 * Scheduler tick endpoint. Intended to be called by an external scheduler (e.g.
 * Vercel Cron) on a short interval. Protected by a shared secret header so it
 * can't be triggered by anyone who can reach the deployment.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("x-cron-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results = await processDueEnrollments();
  return NextResponse.json({ processed: results.length, results });
}
