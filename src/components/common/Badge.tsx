import React from 'react';
import { ApplicationStatus } from '../../types';

interface BadgeProps {
  status: ApplicationStatus;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  let badgeClass = 'badge-noreply';

  switch (status) {
    case 'Sent':
      badgeClass = 'badge-sent';
      break;
    case 'Pending':
    case 'Ready':
    case 'Sending':
    case 'Unknown':
      badgeClass = 'badge-pending';
      break;
    case 'Interview':
      badgeClass = 'badge-interview';
      break;
    case 'Rejected':
    case 'Failed':
      badgeClass = 'badge-rejected';
      break;
    case 'No Reply':
    default:
      badgeClass = 'badge-noreply';
      break;
  }

  return <span className={`badge ${badgeClass}`}>{status}</span>;
};
