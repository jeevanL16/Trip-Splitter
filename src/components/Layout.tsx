import type { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import './Layout.css';

export function Layout(): ReactElement {
  return (
    <div className="layout-root">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="layout-main container">
        <Outlet />
      </main>
    </div>
  );
}
