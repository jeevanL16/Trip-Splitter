import type { ReactElement } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';

export function Navbar(): ReactElement {
  return (
    <header className="navbar-header">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo-icon" aria-hidden="true">✈</span>
          <span className="navbar-brand-text">Trip Splitter</span>
        </Link>
        <nav aria-label="Main" className="navbar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            Expenses
          </NavLink>
          <NavLink
            to="/expenses/new"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            Add expense
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
