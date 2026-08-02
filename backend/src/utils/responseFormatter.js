export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
    const response = {
        success: true,
        message,
        data,
    };
    if (meta) {
        response.meta = meta;
    }
    return res.status(statusCode).json(response);
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, details = null) => {
    return res.status(statusCode).json({
        success: false,
        error: message,
        details,
    });
};
