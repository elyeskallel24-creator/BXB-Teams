export const LEAD_STAGES = [
  'New Lead', 'Researching', 'Ready to Contact', 'Contact Attempted',
  'Contacted', 'Response Received', 'Qualified', 'Meeting Proposed',
  'Meeting Scheduled', 'Discovery Completed', 'Technical Review',
  'Proposal Preparation', 'Proposal Sent', 'Negotiation', 'Won', 'Lost', 'Nurture', 'Disqualified', 'Duplicate'
];

export const QUALIFIED_STAGES = [
  'Qualified', 'Meeting Proposed', 'Meeting Scheduled', 'Discovery Completed',
  'Technical Review', 'Proposal Preparation', 'Proposal Sent', 'Negotiation', 'Won'
];

export const INACTIVE_STAGES = ['Won', 'Lost', 'Disqualified', 'Duplicate', 'Nurture'];

export const DEAL_STAGES = [
  'Opportunity Created', 'Technical Assessment', 'Pricing Review', 'Proposal Draft',
  'Internal Approval', 'Proposal Approved', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'
];

export const OPEN_DEAL_STAGES = [
  'Opportunity Created', 'Technical Assessment', 'Pricing Review', 'Proposal Draft',
  'Internal Approval', 'Proposal Approved', 'Proposal Sent', 'Negotiation'
];

export function stageBadgeClass(stage: string) {
  if (stage === 'Won') return 'badge-success';
  if (['Lost', 'Disqualified', 'Duplicate'].includes(stage)) return 'badge-danger';
  if (stage === 'Nurture') return 'badge-neutral';
  if (QUALIFIED_STAGES.includes(stage)) return 'badge-brand';
  return 'badge-info';
}

export function priorityBadgeClass(p: string) {
  if (p === 'Urgent') return 'badge-danger';
  if (p === 'High') return 'badge-warning';
  if (p === 'Low') return 'badge-info';
  return 'badge-neutral';
}