import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCallLogs, getActiveCalls, getCallLog, updateCallLog, hangupCall } from '../api/calls';
import useWebSocket from '../hooks/useWebSocket';
import {
  Phone, PhoneCall, PhoneOff, Play, Pause, X, Search, ChevronUp, ChevronDown,
  Clock, User, Hash, FileText, Download, Edit3, Save, Loader2, AlertCircle,
  Volume2, Radio
} from 'lucide-react';

const STATUS_COLORS = {
  queued: 'bg-gray-100 text-gray-700',
  ringing: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  transferring: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-700',
  no_answer: 'bg-orange-100 text-orange-700',
  voicemail: 'bg-indigo-100 text-indigo-700',
  busy: 'bg-red-100 text-red-600',
};

const STATUS_LABELS = {
  queued: 'Queued',
  ringing: 'Ringing',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  transferring: 'Transferring',
  completed: 'Completed',
  failed: 'Failed',
  no_answer: 'No Answer',
  voicemail: 'Voicemail',
  busy: 'Busy',
};

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleString();
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// --- Live Duration Timer ---
function LiveTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return <span className="font-mono text-sm">{formatDuration(elapsed)}</span>;
}

// --- Active Call Card ---
function ActiveCallCard({ call, onClick, onHangup, hangingUp }) {
  const statusIcon = call.status === 'in_progress' ? (
    <Radio size={14} className="text-green-500 animate-pulse" />
  ) : call.status === 'ringing' ? (
    <PhoneCall size={14} className="text-blue-500 animate-bounce" />
  ) : (
    <Phone size={14} className="text-gray-400" />
  );

  return (
    <div
      onClick={() => onClick(call)}
      className="bg-white border border-green-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="font-medium text-sm">{call.patient_name || 'Unknown Patient'}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={call.status} />
          <button
            onClick={(e) => { e.stopPropagation(); onHangup(call.id); }}
            disabled={hangingUp === call.id}
            className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
            title="End call"
          >
            <PhoneOff size={12} />
            {hangingUp === call.id ? 'Ending...' : 'Hang Up'}
          </button>
        </div>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        {call.insurance_company && <div>{call.insurance_company}</div>}
        <div className="flex items-center gap-1">
          <Phone size={12} /> {call.phone_number}
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} /> <LiveTimer startedAt={call.started_at} />
        </div>
      </div>
      {call.transcript && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 line-clamp-2 italic">
            {call.transcript.split('\n').filter(Boolean).slice(-1)[0]}
          </p>
        </div>
      )}
    </div>
  );
}

const ACTIVE_STATUSES = new Set(['queued', 'ringing', 'in_progress', 'on_hold', 'transferring']);

// --- Call Detail Modal ---
function CallDetailModal({ callId, onClose, onUpdated }) {
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hangingUp, setHangingUp] = useState(false);
  const [form, setForm] = useState({ rep_name: '', reference_number: '', admin_notes: '' });

  useEffect(() => {
    if (!callId) return;
    setLoading(true);
    getCallLog(callId).then(({ data }) => {
      setCall(data);
      setForm({
        rep_name: data.rep_name || '',
        reference_number: data.reference_number || '',
        admin_notes: data.admin_notes || '',
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [callId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateCallLog(callId, form);
      setCall({ ...call, ...data });
      setEditing(false);
      onUpdated?.();
    } catch (e) {
      console.error('Failed to update call log', e);
    }
    setSaving(false);
  };

  const handleHangup = async () => {
    setHangingUp(true);
    try {
      await hangupCall(callId);
      setCall((c) => ({ ...c, status: 'completed', call_outcome: 'hung_up' }));
      onUpdated?.();
    } catch (e) {
      alert('Failed to hang up: ' + (e.response?.data?.detail || e.message));
    }
    setHangingUp(false);
  };

  if (!callId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Call Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : !call ? (
          <div className="p-12 text-center text-gray-400">Call not found</div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(85vh-64px)]">
            {/* Call metadata */}
            <div className="px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Patient</label>
                  <p className="text-sm font-medium">{call.patient_name || '--'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Insurance</label>
                  <p className="text-sm font-medium">{call.insurance_company || '--'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Phone</label>
                  <p className="text-sm">{call.phone_number}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Status</label>
                  <div className="mt-0.5"><StatusBadge status={call.status} /></div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Started</label>
                  <p className="text-sm">{formatDate(call.started_at)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Duration</label>
                  <p className="text-sm">{call.duration_seconds != null ? formatDuration(call.duration_seconds) : '--'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Outcome</label>
                  <p className="text-sm">{call.call_outcome || '--'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Call SID</label>
                  <p className="text-xs text-gray-500 font-mono truncate">{call.call_sid || '--'}</p>
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Call Info</h3>
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                    <Edit3 size={12} /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1"><User size={10} /> Rep Name</label>
                  {editing ? (
                    <input
                      value={form.rep_name}
                      onChange={(e) => setForm({ ...form, rep_name: e.target.value })}
                      className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Insurance rep name"
                    />
                  ) : (
                    <p className="text-sm mt-1">{call.rep_name || '--'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1"><Hash size={10} /> Reference #</label>
                  {editing ? (
                    <input
                      value={form.reference_number}
                      onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                      className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Reference number"
                    />
                  ) : (
                    <p className="text-sm mt-1">{call.reference_number || '--'}</p>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs text-gray-500 flex items-center gap-1"><FileText size={10} /> Admin Notes</label>
                {editing ? (
                  <textarea
                    value={form.admin_notes}
                    onChange={(e) => setForm({ ...form, admin_notes: e.target.value })}
                    rows={3}
                    className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Admin notes..."
                  />
                ) : (
                  <p className="text-sm mt-1 whitespace-pre-wrap">{call.admin_notes || '--'}</p>
                )}
              </div>
            </div>

            {/* Recording */}
            {call.recording_url && (
              <div className="px-6 py-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Volume2 size={14} /> Recording
                </h3>
                <audio controls src={call.recording_url} className="w-full h-10" />
              </div>
            )}

            {/* Transcript */}
            {call.transcript && (
              <div className="px-6 py-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Transcript</h3>
                <pre className="text-xs bg-gray-50 p-3 rounded-lg whitespace-pre-wrap max-h-60 overflow-auto leading-relaxed">
                  {call.transcript}
                </pre>
              </div>
            )}

            {/* Summary */}
            {call.summary && (
              <div className="px-6 py-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
                <p className="text-sm text-gray-700">{call.summary}</p>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={() => window.open(`/tickets/${call.ticket_id}`, '_self')}
                className="text-sm text-indigo-600 hover:underline"
              >
                View Ticket
              </button>
              {ACTIVE_STATUSES.has(call.status) && (
                <button
                  onClick={handleHangup}
                  disabled={hangingUp}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 ml-auto"
                >
                  <PhoneOff size={14} />
                  {hangingUp ? 'Ending...' : 'End Call'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Transfer Alert Banner ---
function TransferAlert({ alert, onDismiss }) {
  if (!alert) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 shadow-lg max-w-sm">
      <PhoneCall size={18} className="text-amber-600 mt-0.5 shrink-0 animate-pulse" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-800">Incoming Transfer — Pick Up!</p>
        {alert.reason && <p className="text-xs text-amber-700 mt-0.5">{alert.reason}</p>}
      </div>
      <button onClick={onDismiss} className="text-amber-500 hover:text-amber-700">
        <X size={16} />
      </button>
    </div>
  );
}

// --- Main Page ---
export default function CallLogsPage() {
  const [activeCalls, setActiveCalls] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [transferAlert, setTransferAlert] = useState(null);
  const [hangingUp, setHangingUp] = useState(null);
  const navigate = useNavigate();
  const searchTimeout = useRef(null);

  // Fetch active calls
  const fetchActive = useCallback(async () => {
    try {
      const { data } = await getActiveCalls();
      setActiveCalls(data);
    } catch (e) {
      console.error('Failed to fetch active calls', e);
    }
  }, []);

  // Fetch call history
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await getCallLogs(params);
      setCalls(data);
    } catch (e) {
      console.error('Failed to fetch call logs', e);
    }
    setLoading(false);
  }, [statusFilter, search, page]);

  useEffect(() => { fetchActive(); }, [fetchActive]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleHangup = async (callLogId) => {
    setHangingUp(callLogId);
    try {
      await hangupCall(callLogId);
      setActiveCalls((prev) => prev.filter((c) => c.id !== callLogId));
      fetchHistory();
    } catch (e) {
      alert('Failed to hang up: ' + (e.response?.data?.detail || e.message));
    }
    setHangingUp(null);
  };

  // Debounced search
  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  // WebSocket for real-time updates
  useWebSocket(useCallback((msg) => {
    const { event, data } = msg;
    if (event === 'call:started') {
      setActiveCalls((prev) => [{ ...data, id: data.call_log_id, status: 'queued' }, ...prev]);
    } else if (event === 'call:status_update') {
      setActiveCalls((prev) =>
        prev.map((c) => c.id === data.call_log_id ? { ...c, status: data.status } : c)
      );
    } else if (event === 'call:transcript_update') {
      setActiveCalls((prev) =>
        prev.map((c) => {
          if (c.id !== data.call_log_id) return c;
          const line = `\n[${data.timestamp}] ${data.speaker === 'human' ? 'Insurance Rep' : 'AI'}: ${data.message}`;
          return { ...c, transcript: (c.transcript || '') + line };
        })
      );
    } else if (event === 'call:ended') {
      setActiveCalls((prev) => prev.filter((c) => c.id !== data.call_log_id));
      fetchHistory();
    } else if (event === 'call:transfer_initiated') {
      setTransferAlert({ callLogId: data.call_log_id, reason: data.reason });
    }
  }, []));

  // Client-side sort
  const sorted = [...calls].sort((a, b) => {
    const av = a[sortField], bv = b[sortField];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={12} className="text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const STATUS_FILTERS = [
    { value: '', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'failed', label: 'Failed' },
    { value: 'no_answer', label: 'No Answer' },
    { value: 'queued', label: 'Queued' },
    { value: 'busy', label: 'Busy' },
  ];

  return (
    <div className="space-y-6">
      <TransferAlert alert={transferAlert} onDismiss={() => setTransferAlert(null)} />
      <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>

      {/* ========== Active Calls Section ========== */}
      {activeCalls.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Radio size={14} className="text-green-500 animate-pulse" />
            Active Calls ({activeCalls.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeCalls.map((call) => (
              <ActiveCallCard
                key={call.id}
                call={call}
                onClick={(c) => setSelectedCallId(c.id)}
                onHangup={handleHangup}
                hangingUp={hangingUp}
              />
            ))}
          </div>
        </div>
      )}

      {/* ========== Call History Section ========== */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
          Call History
        </h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search by patient name or reference #..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((sf) => (
              <button
                key={sf.value}
                onClick={() => { setStatusFilter(sf.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === sf.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No call logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('patient_name')}>
                      <span className="flex items-center gap-1">Patient <SortIcon field="patient_name" /></span>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('status')}>
                      <span className="flex items-center gap-1">Status <SortIcon field="status" /></span>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('duration_seconds')}>
                      <span className="flex items-center gap-1">Duration <SortIcon field="duration_seconds" /></span>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rep</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ref #</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
                      <span className="flex items-center gap-1">Date <SortIcon field="created_at" /></span>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map((cl) => (
                    <tr
                      key={cl.id}
                      onClick={() => setSelectedCallId(cl.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{cl.patient_name || '--'}</td>
                      <td className="px-4 py-3 text-gray-600">{cl.insurance_company || '--'}</td>
                      <td className="px-4 py-3"><StatusBadge status={cl.status} /></td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {cl.duration_seconds != null ? formatDuration(cl.duration_seconds) : '--'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{cl.rep_name || '--'}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{cl.reference_number || '--'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(cl.created_at)}</td>
                      <td className="px-4 py-3">
                        {cl.call_outcome ? (
                          <span className={`text-xs font-medium ${
                            cl.call_outcome === 'success' ? 'text-green-600' :
                            cl.call_outcome === 'failed' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {cl.call_outcome}
                          </span>
                        ) : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && sorted.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={sorted.length < 20}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========== Call Detail Modal ========== */}
      {selectedCallId && (
        <CallDetailModal
          callId={selectedCallId}
          onClose={() => setSelectedCallId(null)}
          onUpdated={fetchHistory}
        />
      )}
    </div>
  );
}
