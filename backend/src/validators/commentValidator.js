import Joi from 'joi';

export const createCommentSchema = Joi.object({
    cardId: Joi.number().integer().positive().required(),
    content: Joi.string().min(1).max(2000).required(),
});

export const updateCommentSchema = Joi.object({
    content: Joi.string().min(1).max(2000).required(),
});
