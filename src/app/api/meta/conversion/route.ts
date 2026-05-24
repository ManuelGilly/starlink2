import { NextRequest, NextResponse } from "next/server";
import { sendCapiEvent, type CapiEventName, type CapiCustomData } from "@/lib/meta/capi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ConversionRequestBody {
  eventName: CapiEventName;
  eventId: string;
  eventSourceUrl?: string;
  email?: string;
  phone?: string;
  externalId?: string;
  fbp?: string;
  fbc?: string;
  customData?: CapiCustomData;
}

function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return req.headers.get("x-real-ip") ?? undefined;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ConversionRequestBody;

  if (!body.eventName || !body.eventId) {
    return NextResponse.json({ ok: false, error: "Missing eventName or eventId" }, { status: 400 });
  }

  const result = await sendCapiEvent({
    eventName: body.eventName,
    eventId: body.eventId,
    eventSourceUrl: body.eventSourceUrl,
    actionSource: "website",
    userData: {
      email: body.email,
      phone: body.phone,
      externalId: body.externalId,
      fbp: body.fbp,
      fbc: body.fbc,
      clientIp: getClientIp(req),
      userAgent: req.headers.get("user-agent") ?? undefined,
    },
    customData: body.customData,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
