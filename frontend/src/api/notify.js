import client from './client';

export const notifyPatient = (ticketId) =>
  client.post(`/tickets/${ticketId}/notify`);
