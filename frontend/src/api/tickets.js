import client from './client';

export const getTickets = (params = {}) => client.get('/tickets', { params });
export const getTicket = (id) => client.get(`/tickets/${id}`);
export const createTicket = (data) => client.post('/tickets', data);
export const updateTicket = (id, data) => client.patch(`/tickets/${id}`, data);
export const deleteTicket = (id) => client.delete(`/tickets/${id}`);
export const uploadFile = (ticketId, file, fileType) => {
  const form = new FormData();
  form.append('file', file);
  form.append('file_type', fileType);
  return client.post(`/tickets/${ticketId}/uploads`, form);
};
