// Shared color palette
export const C = {
  bg: "#08080d",
  surface: "#101018",
  border: "#1c1c2e",
  text: "#dddce4",
  textMuted: "#7a7a92",
  textDim: "#3e3e56",
  accent: "#c9a0ff",
  green: "#7ae8a0",
  orange: "#f0b866",
  red: "#f07878",
  blue: "#78b8f0",
  cyan: "#6aded8",
  pink: "#e88acd",
  yellow: "#e8e070",
}

// Font families
export const F = {
  mono: "'JetBrains Mono', 'SF Mono', monospace",
  sans: "'DM Sans', 'Helvetica Neue', sans-serif",
  display: "'Space Grotesk', 'DM Sans', sans-serif",
}

// Badge component
export function Badge({ children, color, small }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: small ? "1px 6px" : "2px 8px",
        borderRadius: 4,
        fontSize: small ? 10 : 11,
        fontFamily: F.mono,
        fontWeight: 600,
        color,
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  )
}

// Section component
export function Section({ title, sub, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 14 }}>
        <h2
          style={{
            fontFamily: F.display,
            fontSize: 17,
            fontWeight: 700,
            color: C.text,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
        {sub && (
          <p
            style={{
              fontFamily: F.mono,
              fontSize: 10,
              color: C.textMuted,
              margin: "3px 0 0 0",
            }}
          >
            {sub}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

// Pre component for code blocks
export function Pre({ children }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 7,
        fontFamily: F.mono,
        fontSize: 11,
        color: C.textMuted,
        lineHeight: 1.7,
        overflowX: "auto",
        whiteSpace: "pre",
      }}
    >
      {children}
    </div>
  )
}

// InfoBox component for highlighted information
export function InfoBox({ title, color, children }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: `${color}06`,
        border: `1px solid ${color}18`,
        borderRadius: 7,
      }}
    >
      <div
        style={{
          fontFamily: F.sans,
          fontSize: 12,
          fontWeight: 700,
          color,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 11,
          color: C.textMuted,
          lineHeight: 1.65,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Clr component for inline colored text
export function Clr({ c, children }) {
  return <span style={{ color: c }}>{children}</span>
}

// PageContainer component
export function PageContainer({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: F.sans,
        padding: "20px 16px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={{ maxWidth: 780, margin: "0 auto" }}>{children}</div>
    </div>
  )
}
