// step 1. Create an apollo server instance by going to the apollo server github
// https://github.com/apollographql/apollo-server
// Must npm install apollo-server graphql in project
// Running npm start will start the server. Go to the localhost url to view it.

// install sequelize to project and run sequelize init for boilerplate
const { ApolloServer } = require("apollo-server");

require("dotenv").config;

const { sequelize } = require("./models");

// The GraphQL schema
// You can think of them as routes
const typeDefs = require("./graphql/typeDefs");

// A map of functions which return data for the schema.
// Resolvers are kind of like handlers of above typeDefs(routes)
const resolvers = require("./graphql/resolvers");

const contextMiddleWare = require("./utils/contextMiddleware");

// Starting a new instance of the apollo server
// takes in the typeDefs and resolvers
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: contextMiddleWare,
  subscriptions: { path: "/" },
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`🚀 Server ready at ${url}`);
  console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`);

  sequelize
    .authenticate()
    .then(() => console.log("Database connected!"))
    .catch((err) => console.log(err));
});
