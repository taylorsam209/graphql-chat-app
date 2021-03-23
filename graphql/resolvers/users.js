const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError, AuthenticationError } = require("apollo-server");
const { Message, User } = require("../../models");
const { Op } = require("sequelize");

module.exports = {
  Query: {
    getUsers: async (_, __, { user }) => {
      try {
        if (!user) throw new AuthenticationError("Unauthenticated");

        let users = await User.findAll({
          attributes: ["username", "imageUrl", "createdAt"],
          where: { username: { [Op.ne]: user.username } },
        });

        const allUserMessages = await Message.findAll({
          where: {
            [Op.or]: [{ from: user.username }, { to: user.username }],
          },
          order: [["createdAt", "DESC"]],
        });

        users = users.map((otherUser) => {
          const latestMessage = allUserMessages.find(
            (m) => m.from === otherUser.username || m.to === otherUser.username
          );
          otherUser.latestMessage = latestMessage;
          return otherUser;
        });

        return users;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    login: async (_, args) => {
      const { username, password } = args;
      let errors = {};

      try {
        // validates username not empty
        if (username.trim() === "")
          errors.username = "username must not be empty";

        // validates password not empty
        if (password === "") errors.password = "password must not be empty";

        // If any errors now, throw error
        if (Object.keys(errors).length > 0) {
          throw new UserInputError("bad input", { errors });
        }

        // Checks for user with username
        const user = await User.findOne({ where: { username } });
        // If user is null, throw error user not found
        if (!user) {
          errors.username = "user not found";
          throw new UserInputError("user not found", { errors });
        }

        // checks if password is correct, else throw error
        const correctPassword = await bcrypt.compare(password, user.password);
        if (!correctPassword) {
          errors.password = "password is incorrect";
          throw new UserInputError("password is incorrect", { errors });
        }

        // create a signature token that appends on the user object
        const token = jwt.sign({ username }, process.env.JWT_SECRET, {
          expiresIn: 60 * 60,
        });

        // returns the user
        return {
          ...user.toJSON(),
          token,
        };
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
  Mutation: {
    register: async (_, args) => {
      let { username, email, password, confirmPassword } = args;
      let errors = {};
      try {
        // TODO: Validate input data
        if (email.trim() === "") errors.email = "Email must not be empty";
        if (username.trim() === "")
          errors.username = "username must not be empty";
        if (password.trim() === "")
          errors.password = "password must not be empty";
        if (confirmPassword.trim() === "")
          errors.confirmPassword = "repeat password must not be empty";

        if (password !== confirmPassword)
          errors.confirmPassword = "repeat password must match";

        // TODO: Check if username/email exists
        // const userByUsername = await User.findOne({ where: { username } });
        // const userByEmail = await User.findOne({ where: { email } });

        // if (userByUsername) errors.username = "Username is taken";
        // if (userByEmail) errors.email = "Email is taken";

        if (Object.keys(errors).length > 0) {
          throw errors;
        }

        // TODO: Hash Password
        password = await bcrypt.hash(password, 6);

        // TODO: Create user
        const user = await User.create({
          username,
          email,
          password,
        });
        // TODO: Return user
        return user;
      } catch (err) {
        console.log(err);
        if (err.name === "SequelizeUniqueConstraintError") {
          err.errors.forEach(
            (e) => (errors[e.path] = `${e.path} is already taken`)
          );
        } else if (err.name === "SequelizeValidationError") {
          err.errors.forEach((e) => (errors[e.path] = e.message));
        }
        throw new UserInputError("Bad Input", { errors });
      }
    },
  },
};
