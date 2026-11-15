const LIGHT_IMG = '/assets/aistudio/light_mode_9f0c303b.png';
const DARK_IMG = '/assets/aistudio/dark_mode_c819e5ab.png';

export function SiteBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <div className="hero">
        <div className="blur-overlay blur-overlay-top" />
        <div className="blur-overlay blur-overlay-bottom" />
        <div
          className="hero-bg transition-opacity duration-500 opacity-100 dark:opacity-0"
          style={{ backgroundImage: `url(${LIGHT_IMG})` }}
        />
        <div
          className="hero-bg transition-opacity duration-500 opacity-0 dark:opacity-100"
          style={{ backgroundImage: `url(${DARK_IMG})` }}
        />
      </div>
    </div>
  );
}
