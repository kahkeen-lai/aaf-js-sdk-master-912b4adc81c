export default {
  method: 'GET',
  path: '',
  status: 401,
  data: {
    status: 401,
    message: 'User is not authorized to perform this action',
    name: 'Unauthorized',
    errorCode: '401-9000',
    data: 'Authorization header is not exist'
  },
  error: true
};
