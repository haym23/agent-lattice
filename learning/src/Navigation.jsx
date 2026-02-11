import { C, F } from "./components"

const PAGES = [
  { id: 1, title: "Why Agent Lattice", short: "Why" },
  { id: 2, title: "Programs Not Prompts", short: "Philosophy" },
  { id: 3, title: "Blocks → IR → Runtime", short: "Pipeline" },
  { id: 4, title: "Intent Compilation Layer", short: "Deep Dive" },
  { id: 5, title: "Reliability & Transparency", short: "Trust" },
  { id: 6, title: "Vision & Roadmap", short: "Future" },
]

export function Navigation({ currentPage, onPageChange }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          gap: 2,
          background: C.surface,
          borderRadius: 7,
          padding: 3,
          border: `1px solid ${C.border}`,
          flexWrap: "wrap",
        }}
      >
        {PAGES.map((page) => (
          <button
            key={page.id}
            onClick={() => onPageChange(page.id)}
            style={{
              flex: 1,
              minWidth: 100,
              padding: "8px 12px",
              background:
                currentPage === page.id ? `${C.accent}15` : "transparent",
              border:
                currentPage === page.id
                  ? `1px solid ${C.accent}28`
                  : "1px solid transparent",
              borderRadius: 5,
              fontFamily: F.sans,
              fontSize: 11,
              fontWeight: currentPage === page.id ? 700 : 500,
              color: currentPage === page.id ? C.accent : C.textMuted,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (currentPage !== page.id) {
                e.target.style.color = C.text
                e.target.style.background = `${C.surface}dd`
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== page.id) {
                e.target.style.color = C.textMuted
                e.target.style.background = "transparent"
              }
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <span style={{ fontSize: 9, opacity: 0.6 }}>
                {String(page.id).padStart(2, "0")}
              </span>
              <span>{page.short}</span>
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          padding: "10px 14px",
          background: `${C.blue}06`,
          border: `1px solid ${C.blue}18`,
          borderRadius: 7,
          fontFamily: F.mono,
          fontSize: 10,
          color: C.textMuted,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          {currentPage > 1 && (
            <button
              onClick={() => onPageChange(currentPage - 1)}
              style={{
                padding: "4px 10px",
                background: "transparent",
                border: `1px solid ${C.blue}30`,
                borderRadius: 4,
                color: C.blue,
                fontFamily: F.mono,
                fontSize: 10,
                cursor: "pointer",
              }}
            >
              ← Previous
            </button>
          )}
        </div>
        <div style={{ color: C.text, fontWeight: 600 }}>
          {PAGES.find((p) => p.id === currentPage)?.title}
        </div>
        <div>
          {currentPage < PAGES.length && (
            <button
              onClick={() => onPageChange(currentPage + 1)}
              style={{
                padding: "4px 10px",
                background: "transparent",
                border: `1px solid ${C.blue}30`,
                borderRadius: 4,
                color: C.blue,
                fontFamily: F.mono,
                fontSize: 10,
                cursor: "pointer",
              }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export { PAGES }
