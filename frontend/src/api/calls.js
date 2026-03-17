import client from './client';

export const triggerCall = (ticketId, targetNumber) =>
  client.post(`/tickets/${ticketId}/calls`, { target_number: targetNumber });

export const getCallLogs = (params = {}) => client.get('/call-logs', { params });
export const getActiveCalls = () => client.get('/call-logs/active');
export const getCallLog = (id) => client.get(`/call-logs/${id}`);
export const updateCallLog = (id, data) => client.patch(`/call-logs/${id}`, data);
export const testCall = (phoneNumber) => client.post('/test-call', { phone_number: phoneNumber });
export const twilioHealth = () => client.get('/twilio/health');
export const hangupCall = (callLogId) => client.post(`/call-logs/${callLogId}/hangup`);
