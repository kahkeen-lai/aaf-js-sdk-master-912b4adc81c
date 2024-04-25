export default {
  method: 'GET',
  path: '/xaaba/v1/opportunity',

  status: 404,
  errorCode: '404-1',
  data: {
    message: 'Asset retrieved from ADR cannot be found on BE',
    name: 'XaabaError',
    errorCode: '404-1',
    data: 'No ad returned'
  }
};
