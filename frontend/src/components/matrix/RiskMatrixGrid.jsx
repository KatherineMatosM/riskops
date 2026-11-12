import { useNavigate } from "react-router-dom";

function cellColor(probability, impact) {
  const score = probability * impact;
  if (score <= 4) return "#c8e6c9";
  if (score <= 9) return "#fff9c4";
  if (score <= 16) return "#ffcc80";
  return "#ef9a9a";
}

export default function RiskMatrixGrid({ cells }) {
  const navigate = useNavigate();
  const grid = {};
  cells.forEach((cell) => {
    grid[`${cell.probability}-${cell.impact}`] = cell;
  });

  return (
    <div className="risk-matrix">
      {[5, 4, 3, 2, 1].map((probability) => (
        <div className="risk-matrix-row" key={probability}>
          <div className="risk-matrix-axis-label">{probability}</div>
          {[1, 2, 3, 4, 5].map((impact) => {
            const cell = grid[`${probability}-${impact}`];
            return (
              <button
                type="button"
                key={impact}
                className="risk-matrix-cell"
                style={{ backgroundColor: cellColor(probability, impact) }}
                disabled={!cell?.count}
                aria-label={`Probabilidad ${probability}, impacto ${impact}: ${cell?.count || 0} riesgos`}
                title={`Probabilidad ${probability} · Impacto ${impact} · ${cell?.count || 0} riesgos`}
                onClick={() => cell?.count > 0 && navigate(`/risks?probability=${probability}&impact=${impact}`)}
              >
                <strong>{cell?.count || 0}</strong>
              </button>
            );
          })}
        </div>
      ))}
      <div className="risk-matrix-row risk-matrix-x-axis">
        <div className="risk-matrix-axis-label" />
        {[1, 2, 3, 4, 5].map((impact) => (
          <div key={impact} className="risk-matrix-axis-label">{impact}</div>
        ))}
      </div>
    </div>
  );
}
