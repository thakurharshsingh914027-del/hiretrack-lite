"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main
          id="main-content"
          style={{
            alignItems: "center",
            display: "flex",
            fontFamily: "system-ui, sans-serif",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "24px",
          }}
        >
          <div style={{ maxWidth: "520px", textAlign: "center" }}>
            <p style={{ color: "#08785e", fontWeight: 700 }}>HireTrack Lite</p>
            <h1 style={{ fontSize: "32px", margin: "12px 0" }}>
              The application could not start
            </h1>
            <p style={{ color: "#52606d", lineHeight: 1.6 }}>
              Retry the application. If the problem continues, refresh the
              browser before returning to your work.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#08785e",
                border: 0,
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
                marginTop: "24px",
                minHeight: "44px",
                padding: "0 20px",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
