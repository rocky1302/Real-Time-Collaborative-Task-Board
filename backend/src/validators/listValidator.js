import Joi from 'joi';

export const createListSchema = Joi.object({
    boardId: Joi.number().integer().positive().required(),
    title: Joi.string().min(1).max(100).required(),
    position: Joi.number().integer().min(0),
});

export const updateListSchema = Joi.object({
    title: Joi.string().min(1).max(100),
    position: Joi.number().integer().min(0),
});
