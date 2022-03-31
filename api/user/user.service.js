const db = require('../helpers/database');

const { User } = db;

module.exports = {
  create,
  get,
  getByEmail,
  findByToken,
  update,
  getById,
  modifyWishList,
  getByVerifyEmailToken,
  getByType,
};

async function create(user) {
  const new_user = User(user);
  let response = {};
  try {
    response = await new_user.save();
  } catch (err) {
    console.log(err);
    response.error = 'There was an issue while creating the user.';
  }
  return response;
}

async function getByEmail(email) {
  try {
    return await User.find({ email });
  } catch (err) {
    throw new Error(err);
  }
}

async function get(query) {
  try {
    return await User.find(query);
  } catch (err) {
    throw new Error(err);
  }
}

async function getByVerifyEmailToken(emailVerifyToken) {
  try {
    return await User.find({ emailVerifyToken });
  } catch (err) {
    throw new Error(err);
  }
}

async function getByType(userType) {
  try {
    return await User.find({ type: userType });
  } catch (err) {
    throw new Error(err);
  }
}

async function findByToken(token) {
  try {
    return await User.find({ resetToken: token });
  } catch (err) {
    throw new Error(err);
  }
}

async function update(user, id) {
  try {
    const foundUser = await User.findOne({ _id: id });
    Object.assign(foundUser, user);

    return foundUser.save();
  } catch (err) {
    throw new Error(err);
  }
}

async function modifyWishList(newWishList, id) {
  try {
    const user = await User.findOne({ _id: id });
    user.wishList = newWishList;

    return user.save();
  } catch (err) {
    throw new Error(err);
  }
}

async function getById(id) {
  try {
    return await User.findById(id);
  } catch (err) {
    throw new Error(err);
  }
}
