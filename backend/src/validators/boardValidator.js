import Joi from 'joi';

export const createBoardSchema = Joi.object({
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().allow('', null).max(1000),
});

export const updateBoardSchema = Joi.object({
    title: Joi.string().min(1).max(100),
    description: Joi.string().allow('', null).max(1000),
});

export const addMemberSchema = Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('owner', 'editor', 'viewer').default('editor'),
});

export const updateMemberRoleSchema = Joi.object({
    role: Joi.string().valid('owner', 'editor', 'viewer').required(),
});
