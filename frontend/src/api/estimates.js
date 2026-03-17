import client from './client';

export const generateEstimate = (data) => client.post('/estimates/generate', data);
export const addBenefits = (ticketId, data) =>
  client.post(`/tickets/${ticketId}/benefits`, data);
