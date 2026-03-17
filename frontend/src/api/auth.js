import client from './client';

export const registerUser = (name, email, password) =>
  client.post('/auth/register', { name, email, password });

export const loginUser = (email, password) =>
  client.post('/auth/login', { email, password });
