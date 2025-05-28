function success(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}
function error(res, message = 'Error', statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
}

function paginated(res, data, pagination, message = 'Success') {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(pagination.page),
      limit: parseInt(pagination.limit),
      total: pagination.total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  });
}

function validationError(res, errors) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: Array.isArray(errors) ? errors : [errors],
    timestamp: new Date().toISOString()
  });
}

function notFound(res, resource = 'Resource') {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  success,
  error,
  paginated,
  validationError,
  notFound
}