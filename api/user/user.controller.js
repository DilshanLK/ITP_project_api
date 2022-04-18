/* eslint-disable array-callback-return */
/* eslint-disable no-underscore-dangle */
const express = require('express');

const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { success, error, validation } = require('../helpers/responses');
const { createToken } = require('../helpers/authMiddleware');
const userService = require('./user.service');

router.get('/me', getInfo);
router.get('/', getAll);
router.get('/:id', getByUser);
router.post('/signup', validate('signUp'), signUp);
router.post('/login', validate('login'), login);
router.post('/admin/login', validate('login'), adminLogin);
router.put('/:id', update);

function validate(method) {
  switch (method) {
    case 'forgetPw': {
      return [
        body('email', "Email doesn't exist.").exists(),
        body('email', 'Email is empty.').notEmpty(),
        body('email', 'Email is invalid.').isEmail(),
      ];
    }
    case 'login': {
      return [
        body('email', "Email doesn't exist.").exists(),
        body('password', "Password doesn't exist.").exists(),
        body('email', 'Email is empty.').notEmpty(),
        body('password', 'Password is empty.').notEmpty(),
      ];
    }
    case 'signUp': {
      return [
        body('name', "Name doesn't exist.").exists(),
        body('name', 'Name is empty.').notEmpty(),
        body('email', "Email doesn't exist.").exists(),
        body('email', 'Email is empty.').notEmpty(),
        body('email', 'Email is invalid.').isEmail(),
        body('password', "Password doesn't exist.").exists(),
        body('password', 'Password is empty.').notEmpty(),
      ];
    }
    default:
      return true;
  }
}

module.exports = router;

async function signUp(req, res) {
  console.log(req.body);
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json(validation(errors.array()));
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    req.body.password = bcrypt.hashSync(req.body.password, salt);

    const existingUsers = await userService.getByEmail(req.body.email);

    if (existingUsers.length) {
      res.status(409).json(validation({ email: 'Email already exists!' }));

      return;
    }

    const newUser = await userService.create({
      ...req.body,
    });

    const token = createToken({ id: newUser._id });

    const newCleanUser = JSON.parse(JSON.stringify(newUser));

    return res
      .status(200)
      .json(success('OK', { user: newCleanUser, token }, res.statusCode));
  } catch (e) {
    return res.status(500).json(error(e.message));
  }
}

async function login(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json(validation(errors.array()));
    return;
  }

  const users = await userService.getByEmail(req.body.email);
  console.log('user', users);

  if (!users.length || !users[0].password) {
    return res.status(404).json(validation([{ msg: 'Invalid credentials!' }]));
  }

  if (users[0].isDeleted) {
    return res.status(400).json(validation([{ msg: 'Account not found!!' }]));
  }

  if (!bcrypt.compareSync(req.body.password, users[0].password)) {
    return res.status(400).json(validation([{ msg: 'Invalid credentials!' }]));
  }

  const user = JSON.parse(JSON.stringify(users[0]));

  const token = createToken({ id: user._id });
  user.password = undefined;

  return res.status(200).json(success('OK', { user, token }, res.statusCode));
}

async function adminLogin(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json(validation(errors.array()));
    return;
  }

  const users = await userService.getByEmail(req.body.email);

  if (!users.length || users[0].password !== req.body.password) {
    return res.status(404).json(validation([{ msg: 'Invalid credentials!' }]));
  }

  const token = createToken({ id: users[0]._id });
  users[0].password = undefined;
  return res
    .status(200)
    .json(success('OK', { user: users[0], token }, res.statusCode));
}

async function getInfo(req, res) {
  try {
    console.log(req.user.id);
    const user = await userService.getById(req.user.id);

    if (!user) {
      return res.status(404).json(validation([{ msg: 'No user found.' }]));
    }

    user.password = undefined;
    user.twoFASecret = undefined;

    return res.status(200).json(success('OK', user, res.statusCode));
  } catch (e) {
    return res.status(500).json(error(e.message));
  }
}

async function getAll(req, res) {
  try {
    const user = await userService.get({});

    if (!user) {
      return res.status(404).json(validation([{ msg: 'No users found.' }]));
    }

    // user.password = undefined;

    const filteredUsersList = user.filter((filteredUser) => filteredUser.isDeleted === false);

    return res.status(200).json(success('OK', filteredUsersList, res.statusCode));
  } catch (e) {
    return res.status(500).json(error(e.message));
  }
}

async function getByUser(req, res) {
  try {
    const user = await userService.getById(req.params.id);

    if (!user) {
      return res.status(404).json(validation([{ msg: 'No users found.' }]));
    }

    const userType = user.type;

    if (userType === 'ADMIN') {
      const usersList = await userService.get({});

      if (!usersList) {
        return res.status(404).json(validation([{ msg: 'No users found.' }]));
      }

      const filteredUsersList = usersList.filter((filteredUser) => filteredUser.isDeleted === false);

      return res.status(200).json(success('OK', filteredUsersList, res.statusCode));
    } if (userType === 'TEACHER') {
      const studentsList = await userService.get({ assignedTeacher: user._id });

      if (!studentsList.length) {
        return res.status(404).json(error('No students found for teacher.'));
      }

      const filteredStudentsList = studentsList.filter((filteredUser) => filteredUser.isDeleted === false);

      return res.status(200).json(success('OK', filteredStudentsList, res.statusCode));
    } if (userType === 'WB_COORDINATOR') {
      const studentsList = await userService.get({ school: user.school });

      if (!studentsList.length) {
        return res.status(404).json(error('No students found for school.'));
      }

      const filteredUsersList = studentsList.filter((filteredUser) => filteredUser.isDeleted === false);

      return res.status(200).json(success('OK', filteredUsersList, res.statusCode));
    }

    if (userType === 'PSYCHOLOGIST') {
      const studentsList = await userService.get();

      if (!studentsList.length) {
        return res.status(404).json(error('No students found.'));
      }

      const filteredUsersList = studentsList.filter((filteredUser) => filteredUser.isDeleted === false);

      return res.status(200).json(success('OK', filteredUsersList, res.statusCode));
    }

    return res.status(200).json(success('OK', user, res.statusCode));
  } catch (e) {
    return res.status(500).json(error(e.message));
  }
}

async function update(req, res) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json(validation(errors.array()));
      return;
    }

    const user = req.body;

    const updatedUser = await userService.update(user, req.params.id);

    return res.status(200).json(success('OK', updatedUser, res.statusCode));
  } catch (e) {
    return res.status(500).json(error(e.message));
  }
}
