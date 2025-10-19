import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home">
      <svg className="home-blob" viewBox="0 0 800 800" aria-hidden>
        <defs>
          <radialGradient id="g1" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(99,102,241,.30)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0)" />
          </radialGradient>
          <radialGradient id="g2" cx="70%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(56,189,248,.26)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0)" />
          </radialGradient>
        </defs>
        <rect width="800" height="800" fill="url(#g1)" />
        <rect width="800" height="800" fill="url(#g2)" />
      </svg>

      <section className="hero">
        <div className="hero-text">
          <h1>Witaj w <span className="brand-accent">Notes Manager</span></h1>
          <p className="lead">
            Szybkie notatki i tablica do <b>Extreme Programming</b>.
            Przeciągaj karteczki między kolumnami, filtruj i edytuj — lekko i przyjemnie.
          </p>
          <div className="cta">
            <Link to="/notes" className="btn-primary big">Przejdź do notatek</Link>
            <Link to="/board" className="btn-ghost2 big">Otwórz tablicę</Link>
          </div>

          <ul className="bullets">
            <li>📝 Dodawanie / edycja / usuwanie notatek</li>
            <li>🧩 Kanban: To-do → W trakcie → Zrobione</li>
            <li>🌙 Dark mode zapamiętywany w localStorage</li>
          </ul>
        </div>

        <div className="hero-preview">
          {/* mini-podgląd karteczek */}
          <div className="sticky-grid">
            <div className="sticky s1">Zrobić demo</div>
            <div className="sticky s2">Spotkanie z zespołem</div>
            <div className="sticky s3">Deploy</div>
            <div className="sticky s4">Code review</div>
          </div>
          <div className="preview-panel">
            <div className="col">
              <h3>To-do</h3>
              <div className="dot" />
            </div>
            <div className="col">
              <h3>W trakcie</h3>
              <div className="dot" />
            </div>
            <div className="col">
              <h3>Zrobione</h3>
              <div className="dot" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
