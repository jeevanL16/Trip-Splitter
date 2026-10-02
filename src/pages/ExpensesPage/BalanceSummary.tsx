import type { ReactElement } from 'react';
import type { Member, MemberId, Paise } from '../../domain/types';
import { balanceStatus } from '../../domain/balances';
import { formatINR } from '../../domain/money';
import './BalanceSummary.css';

interface BalanceSummaryProps {
  members: readonly Member[];
  balances: Record<MemberId, Paise>;
}

export function BalanceSummary({ members, balances }: BalanceSummaryProps): ReactElement {
  return (
    <section className="balance-section" aria-labelledby="balance-heading">
      <div className="balance-header">
        <h2 id="balance-heading" className="balance-title">
          Trip Balances
        </h2>
        <span className="balance-subtitle">Net balance per member</span>
      </div>

      <div className="balance-grid">
        {members.map((member) => {
          const balance = balances[member.id] ?? 0;
          const status = balanceStatus(balance);
          const formatted = formatINR(Math.abs(balance));

          let statusText = `${member.name} — settled up`;
          let badgeText = 'Settled up';
          let statusClass = 'balance-card-settled';

          if (status === 'gets-back') {
            statusText = `${member.name} — gets back ${formatted}`;
            badgeText = `gets back ${formatted}`;
            statusClass = 'balance-card-gets-back';
          } else if (status === 'owes') {
            statusText = `${member.name} — owes ${formatted}`;
            badgeText = `owes ${formatted}`;
            statusClass = 'balance-card-owes';
          }

          return (
            <div key={member.id} className={`balance-card ${statusClass}`}>
              <div className="balance-member-info">
                <span className="balance-member-avatar" aria-hidden="true">
                  {member.name.charAt(0)}
                </span>
                <div>
                  <span className="balance-member-name">{member.name}</span>
                  <p className="sr-only">{statusText}</p>
                </div>
              </div>
              <div className="balance-status-badge">
                <span className="balance-status-text">{badgeText}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
