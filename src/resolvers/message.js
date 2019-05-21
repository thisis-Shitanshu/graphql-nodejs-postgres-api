import { combineResolvers } from 'graphql-resolvers';

import { 
  isAuthenticated, 
  isMessageOwner 
} from './authorization';

export default {
  Query: {
    messages: async (
      parent, 
      { offset = 0, limit = 100 }, 
      { models }
    ) => {
      return await models.Message.findAll({
        offset,
        limit
      });
    },
    message: async (parent, { id }, { models }) => {
      return await models.Message.findOne({
        where: {
          id: id
        }
      });
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
    deleteMessage: combineResolvers(
      isAuthenticated,
      isMessageOwner,
      async (parent, { id }, { models }) => {
        return await models.Message.destroy({ where: { id } });
      }
    )
  },

  Message: {
    user: async (message, args, { models }) => {
      return await models.User.findOne({
        where: {
          id: message.userId
        }
      });
    },
  },
};