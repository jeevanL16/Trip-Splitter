import type { ChangeEvent, ReactElement } from 'react';
import { CATEGORIES, type Category } from '../../domain/types';
import './CategoryFilter.css';

interface CategoryFilterProps {
  value: Category | 'All';
  onChange: (category: Category | 'All') => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps): ReactElement {
  function handleChange(e: ChangeEvent<HTMLSelectElement>): void {
    const val = e.target.value;
    if (val === 'All') {
      onChange('All');
    } else {
      const match = CATEGORIES.find((c) => c === val);
      if (match) {
        onChange(match);
      }
    }
  }

  return (
    <div className="category-filter-group">
      <label htmlFor="category-filter" className="category-filter-label">
        Filter by category
      </label>
      <select
        id="category-filter"
        value={value}
        onChange={handleChange}
        className="category-filter-select"
      >
        <option value="All">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
