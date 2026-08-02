import { BadRequestError } from '../utils/AppError.js';

export const validateRequest = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const details = error.details.map((detail) => detail.message);
            return next(new BadRequestError('Validation error', details));
        }

        req[property] = value;
        next();
    };
};
