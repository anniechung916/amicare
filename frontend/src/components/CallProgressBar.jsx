import { useEffect, useState } from 'react';
import { Phone, PhoneOff, Radio, Loader2 } from 'lucide-react';
import { hangupCall } from '../api/calls';
import useWebSocket from '../hooks/useWebSocket';

const STEPS = [
  { key: 'queued',       label: 'Queued' },
  { key: 'ringing',      label: 'Ringing' },
  { key: 'in_progress',  label: 'Connected' },
  { key: 'on_hold',      label: 'On Hold' },
  { key: 'completed',    label: 'Done' },
];

const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));

function stepIndex(status) {
  if (status === 'transferring') return STEP_INDEX['in_progress'];
  return STEP_INDEX[status] ?? 0;
}

function formatElapsed(startedAt) {
  if (!startedAt) return '0:00';
  const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * CallProgressBar — embedded in TicketDetailPage when a call is active.
 *
 * Props:
 *   callLog  — { id, status, started_at, phone_number, transcript }
 *   onDone   — callback when call ends (to refresh ticket)
 */
export default function CallProgressBar({ callLog, onDone }) {
  const [status, setStatus] = useState(callLog.status);
  const [transcript, setTranscript] = useState(callLog.transcript || '');
  const [elapsed, setElapsed] = useState('0:00');
  const [hangingUp, setHangingUp] = useState(false);
  const [done, setDone] = useState(false);

  // Live timer
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setElapsed(formatElapsed(callLog.started_at)), 1000);
    return () => clearInterval(id);
  }, [callLog.started_at, done]);

  useWebSocket((msg) => {
    const { event, data } = msg;
    if (!data || data.call_log_id !== callLog.id) return;

    if (event === 'call:status_update') {
      setStatus(data.status);
    } else if (event === 'call:transcript_update') {
      const line = `[${data.timestamp}] ${data.speaker === 'human' ? 'Insurance Rep' : 'AI'}: ${data.message}`;
      setTranscript((t) => (t ? t + '\n' + line : line));
    } else if (event === 'call:ended') {
      setStatus('completed');
      setDone(true);
      onDone?.();
    }
  });

  const handleHangup = async () => {
    setHangingUp(true);
    try {
      await hangupCall(callLog.id);
    } catch (e) {
      console.error('Hangup failed', e);
    }
    setHangingUp(false);
  };

  const currentStep = stepIndex(status);
  const isActive = !done && status !== 'completed' && status !== 'failed';
  const isFailed = status === 'failed' || status === 'no_answer' || status === 'busy';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive ? (
            <Radio size={16} className="text-green-500 animate-pulse" />
          ) : isFailed ? (
            <Phone size={16} className="text-red-500" />
          ) : (
            <Phone size={16} className="text-gray-400" />
          )}
          <span className="text-sm font-semibold text-gray-800">
            {isFailed ? 'Call Failed' : done ? 'Call Completed' : 'Call in Progress'}
          </span>
          {isActive && (
            <span className="text-xs text-gray-400 font-mono">{elapsed}</span>
          )}
          {status === 'transferring' && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              Transferring…
            </span>
          )}
        </div>
        {isActive && (
          <button
            onClick={handleHangup}
            disabled={hangingUp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {hangingUp ? <Loader2 size={12} className="animate-spin" /> : <PhoneOff size={12} />}
            {hangingUp ? 'Ending…' : 'End Call'}
          </button>
        )}
      </div>

      {/* Progress steps */}
      {!isFailed && (
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const isPast = i < currentStep;
            const isCurrent = i === currentStep;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isPast ? 'bg-green-500 text-white' :
                    isCurrent && !done ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' :
                    isCurrent && done ? 'bg-green-500 text-white' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isPast || (isCurrent && done) ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-1 ${
                    isCurrent && !done ? 'text-indigo-600 font-medium' :
                    isPast ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <div className={`h-0.5 flex-1 mx-1 mb-4 transition-all ${isPast ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Live transcript */}
      {transcript && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Live Transcript</p>
          <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 max-h-36 overflow-auto whitespace-pre-wrap leading-relaxed">
            {transcript}
          </pre>
        </div>
      )}
    </div>
  );
}
