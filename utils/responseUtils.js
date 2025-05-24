const logger = require('./logger');

class ResponseUtils {
  static success(res, data = null, message = 'Success', statusCode = 200, options = {}) {
    if (options.cache) {
      const maxAge = options.cache.maxAge || 300;
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      res.setHeader('ETag', options.cache.etag || Date.now().toString());
    }

    if (options.pagination) {
      res.setHeader('X-Total-Count', options.pagination.total);
      res.setHeader('X-Page-Count', options.pagination.pages);
      res.setHeader('X-Current-Page', options.pagination.page);
    }

    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: res.req?.requestId
    };

    if (options.pagination) {
      response.pagination = options.pagination;
    }

    return res.status(statusCode).json(response);
  }

  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: parseInt(pagination.page),
        limit: parseInt(pagination.limit),
        total: pagination.total,
        pages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1
      },
      timestamp: new Date().toISOString()
    });
  }

  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Array.isArray(errors) ? errors : [errors],
      timestamp: new Date().toISOString()
    });
  }

  static notFound(res, resource = 'Resource') {
    return res.status(404).json({
      success: false,
      message: `${resource} not found`,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ResponseUtils;
