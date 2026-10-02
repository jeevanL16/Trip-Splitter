import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Polyfill HTMLDialogElement for jsdom
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
}

afterEach(() => {
  localStorage.clear();
});
