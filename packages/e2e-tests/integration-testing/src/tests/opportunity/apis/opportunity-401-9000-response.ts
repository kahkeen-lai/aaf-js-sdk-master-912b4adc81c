export default {
  method: 'GET',
  path: '/xaaba/v1/opportunity',

  status: 401,
  errorCode: '401-9000',
  data: {
    message: 'User is not authorized to perform this action',
    name: 'Unauthorized',
    errorCode: '401-9000',
    data: 'Authorization header is not exist'
  },
  error: true
};
