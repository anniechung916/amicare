const STATUS_STYLES = {
  pending_estimate: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Estimate' },
  estimate_generated: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Estimate Generated' },
  claim_submitted: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Claim Submitted' },
  calling_insurer: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Calling Insurer' },
  awaiting_payment: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Awaiting Payment' },
  resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resolved' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
