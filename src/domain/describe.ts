import type { Split } from './types';
import { assertNever } from './types';

export function describeSplit(split: Split): string {
  switch (split.type) {
    case 'equal': {
      const count = split.memberIds.length;
      const noun = count === 1 ? 'person' : 'people';
      return `Equally, ${count} ${noun}`;
    }
    case 'exact': {
      const count = Object.values(split.shares).filter((s) => s > 0).length;
      const noun = count === 1 ? 'person' : 'people';
      return `Exact amounts, ${count} ${noun}`;
    }
    case 'percent': {
      const count = Object.values(split.shares).filter((s) => s > 0).length;
      const noun = count === 1 ? 'person' : 'people';
      return `By percentage, ${count} ${noun}`;
    }
    default:
      return assertNever(split);
  }
}
