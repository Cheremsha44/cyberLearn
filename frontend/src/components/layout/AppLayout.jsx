import Sidebar from './Sidebar';
import './AppLayout.css';

const PARTICLE_GLYPHS = ['<>', '{}', '[]', '01', '//', '::', '&&', '||', '+', '*'];

const BACKGROUND_PARTICLES = Array.from({ length: 84 }, (_, index) => ({
  x: (index * 9 + 7) % 100,
  size: 10 + (index % 7) * 1.8,
  duration: 7 + (index % 9),
  delay: -(index * 0.9),
  drift: index % 2 === 0 ? 36 : -30,
  opacity: 0.22 + (index % 6) * 0.1,
  glyph: PARTICLE_GLYPHS[index % PARTICLE_GLYPHS.length]
}));

function getUserFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    return {};
  }
}

function AppLayout({ children }) {
  const user = getUserFromStorage();

  return (
    <div className="dashboard-page app-shell">
      <div className="app-shell-bg" aria-hidden="true">
        <div className="app-shell-grid" />
        <div className="app-shell-particles">
          {BACKGROUND_PARTICLES.map((particle, index) => (
            <span
              key={index}
              className="app-shell-particle"
              style={{
                '--x': `${particle.x}%`,
                '--size': `${particle.size}px`,
                '--duration': `${particle.duration}s`,
                '--delay': `${particle.delay}s`,
                '--drift': `${particle.drift}px`,
                '--opacity': particle.opacity
              }}
            >
              {particle.glyph}
            </span>
          ))}
        </div>
      </div>
      <Sidebar user={user} />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
