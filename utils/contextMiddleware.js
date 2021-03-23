const jwt = require("jsonwebtoken");
const { PubSub } = require("apollo-server");

const pubSub = new PubSub();

module.exports = (context) => {
  let token;
  // Query/Mutation gives back req object, but supsribtions gives back connection obj
  if (context.req && context.req.headers.authorization) {
    token = context.req.headers.authorization.split("Bearer ")[1];
  } else if (context.connection && context.connection.context.Authorization) {
    token = context.connection.context.Authorization.split("Bearer ")[1];
  }

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      context.user = decodedToken;
    });
  }

  context.pubSub = pubSub;

  return context;
};
