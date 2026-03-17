import client from './client';

export const getCarriers = () => client.get('/carriers');
export const getCarrier = (id) => client.get(`/carriers/${id}`);
export const createCarrier = (data) => client.post('/carriers', data);
export const updateCarrier = (id, data) => client.patch(`/carriers/${id}`, data);
export const deleteCarrier = (id) => client.delete(`/carriers/${id}`);
