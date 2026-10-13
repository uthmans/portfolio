import "./portfolio-banner.css";

type Props = { title: string; context?: string; home?: boolean };

/** Shared portfolio frame, including the nested service pages. */
export default function PortfolioBanner({
  title,
  context,
  home = false,
}: Props) {
  return (
    <nav className="portfolio-banner" aria-label="Portfolio navigation">
      <div className="portfolio-banner-inner">
        {home ? (
          <span className="portfolio-banner-home">Uthman’s portfolio</span>
        ) : (
          <a className="portfolio-banner-back" href={import.meta.env.BASE_URL}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M19 12H5m7-7-7 7 7 7"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            Back to portfolio
          </a>
        )}
        <span className="portfolio-banner-page">
          <span>{title}</span>
          {context && (
            <span className="portfolio-banner-context">{context}</span>
          )}
        </span>
      </div>
    </nav>
  );
}
