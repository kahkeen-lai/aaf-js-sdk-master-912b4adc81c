export default {
  method: 'GET',
  path: '/xaaba/v1/opportunity',
  error: true,
  status: 401,
  data: {
    errorCode: '401-1',
    data: 'Session expired',
    name: 'Session_Expired',
    message: 'User session has expired'
  }
};
