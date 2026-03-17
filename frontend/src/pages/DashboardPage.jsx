import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTickets } from '../api/tickets';
import StatusBadge from '../components/common/StatusBadge';
import useWebSocket from '../hooks/useWebSocket';

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'pending_estimate', label: 'Pending Estimate' },
  { value: 'estimate_generated', label: 'Estimate Generated' },
  { value: 'claim_submitted', label: 'Claim Submitted' },
  { value: 'calling_insurer', label: 'Calling Insurer' },
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'resolved', label: 'Resolved' },
];

export default function DashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 20 };
      if (status) params.status = status;
      if (search) params.search = search;
      const { data } = await getTickets(params);
      setTickets(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error('Failed to fetch tickets', e);
    }
    setLoading(false);
  }, [status, search, page]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useWebSocket((msg) => {
    if (msg.type === 'ticket_updated' || msg.type === 'call_status') {
      fetchTickets();
    }
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <button
          onClick={() => navigate('/intake')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + New Ticket
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search patient name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatus(s.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                status === s.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Insurance</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No tickets found</td></tr>
            ) : (
              tickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.patient_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.insurance_company}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
