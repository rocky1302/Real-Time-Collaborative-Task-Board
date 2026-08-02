import Joi from 'joi';

export const registerSchema = Joi.object({
    username: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Username must be at least 2 characters long',
        'string.empty': 'Username is required',
    }),
    email: Joi.string().email({ tlds: { allow: false } }).required().messages({
        'string.email': 'Please enter a valid email address (e.g. user@example.com)',
        'string.empty': 'Email is required',
    }),
    password: Joi.string().min(4).max(100).required().messages({
        'string.min': 'Password must be at least 4 characters long',
        'string.empty': 'Password is required',
    }),
});

export const loginSchema = Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required().messages({
        'string.email': 'Please enter a valid email address',
        'string.empty': 'Email is required',
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required',
    }),
});

export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
});
