import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Starlink Venezuela — Internet satelital en cualquier rincón del país";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(ellipse 90% 60% at 80% 20%, rgba(139,92,246,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 10% 90%, rgba(99,102,241,0.25) 0%, transparent 60%), #0a0a0f",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#a78bfa",
              boxShadow: "0 0 24px #a78bfa",
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Starlink · Venezuela
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: "#fff",
            }}
          >
            Internet desde el espacio.
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              background: "linear-gradient(90deg, #a78bfa 0%, #c4b5fd 50%, #a78bfa 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            En cualquier rincón del país.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", gap: 48 }}>
            {[
              { label: "Residencial", value: "$40" },
              { label: "Itinerante", value: "$60" },
              { label: "Ilimitado", value: "$80" },
            ].map((p) => (
              <div key={p.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div
                  style={{
                    fontSize: 14,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {p.label}
                </div>
                <div style={{ fontSize: 40, fontWeight: 700, color: "#fff" }}>{p.value}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.05em",
            }}
          >
            starlink2.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
