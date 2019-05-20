import { combineResolvers } from 'graphql-resolvers';

import { isAuthenticated } from './authorization';

export default {
  Query: {
    messages: async (parent, args, { models }) => {
      return await models.Message.findAll();
    },
    message: async (parent, { id }, { models }) => {
      return await models.Message.findById(id);
    },
  },
  
  Mutation: {
    createMessage: combineResolvers(
      isAuthenticated,
      async (
        parent, 
        { text }, 
        { me, models }
      ) => {
  
        try {
          return await models.Message.create({
            text,
            userId: me.id,
          });
        } catch (error) {
          throw new Error(error);
        }
      }
    ),
    deleteMessage: async (parent, { id }, { models }) => {
      return await models.Message.destroy({ where: { id } });
    },
  },

  Message: {
    user: async (message, args, { models }) => {
      return await models.User.findById(message.userId);
    },
  },
};