import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export function NotFoundPage(): ReactElement {
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <span className="not-found-badge" aria-hidden="true">
          404
        </span>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-text">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="not-found-link">
          Back to Expenses
        </Link>
      </div>
    </div>
  );
}
