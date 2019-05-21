import 'dotenv/config';
import http from 'http';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import DataLoader from 'dataloader';
import { 
  ApolloServer, 
  AuthenticationError 
} from 'apollo-server-express';


import loader from './loaders';
import schema from './schema';
import resolvers from './resolvers';
import models,{ sequelize } from './models';

const app = express();

app.use(cors());

const getMe = async req => {
  const token = req.headers['x-token'];

  if (token) {
    try {
      return await jwt.verify(token, process.env.SECRET);
    } catch (e) {
      throw new AuthenticationError(
        'Your session expired. Sign in again.'
      );
    }
  }
};

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  formatError: error => {
    // remove the internal sequelize error message
    // leave only imprtant validation error
    const message = error.message
      .replace('SequelizeValidationError: ', '')
      .replace('Validation error: ','');

      return {
        ...error,
        message,
      }
  },
  context: async ({ req, connection }) => {
    if (connection) {
      return {
        models,
        loader: {
          user: new DataLoader(keys => loader.user.batchUsers(keys, models))
        }
      }
    }

    if (req) {
      const me = await getMe(req);
    
      return {
        models,
        me,
        secret: process.env.SECRET,
        loader: {
          user: new DataLoader(keys => loader.user.batchUsers(keys, models))
        }
      }
    }
  }
});

server.applyMiddleware({ app, path: '/graphql' });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const eraseDatabaseOnSync = true;

const isTest = !!process.env.TEST_DATABASE;
const isProduction = !!process.env.DATABASE_URL;
const port = process.env.PORT || 8000;

// For seed in production:
//sequelize.sync({ force: isTest || isProduction })

sequelize.sync({ force: isTest }).then(async () => {
  if (isTest) {
    createUsersWithMessages(new Date());
  }

  httpServer.listen({ port }, () => {
    console.log(`Apollo Server on http://localhost:${port}/graphql`);
  })
});

const createUsersWithMessages = async date => {
  await models.User.create(
    {
      username: 'shitanshu',
      email: 'hello@shitanshu.com',
      password: 'shitanshu',
      role: 'ADMIN',
      messages: [
        {
          text: 'Published the Road to learn React',
          createdAt: date.setSeconds(date.getSeconds() + 1)
        }
      ]
    },
    {
      include: [models.Message]
    }
  );

  await models.User.create(
    {
      username: 'ddavid',
      email: 'hello@ddavid.com',
      password: 'ddavidd',
      messages: [
        {
          text: 'Happy to release ...',
          createdAt: date.setSeconds(date.getSeconds() + 1)
        },
        {
          text: 'Published a complete ...',
          createdAt: date.setSeconds(date.getSeconds() + 1)
        }
      ]
    },
    {
      include: [models.Message]
    }
  );
};