import Joi from 'joi';

export const createCardSchema = Joi.object({
    listId: Joi.number().integer().positive().required(),
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().allow('', null),
    dueDate: Joi.date().iso().allow(null),
    labels: Joi.array().items(Joi.number().integer().positive()),
});

export const updateCardSchema = Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().allow('', null),
    listId: Joi.number().integer().positive(),
    position: Joi.number().integer().min(0),
    dueDate: Joi.date().iso().allow(null),
    isCompleted: Joi.boolean(),
    isArchived: Joi.boolean(),
    labelIds: Joi.array().items(Joi.number().integer().positive()),
});

export const moveCardSchema = Joi.object({
    targetListId: Joi.number().integer().positive().required(),
    newPosition: Joi.number().integer().min(0).required(),
});
