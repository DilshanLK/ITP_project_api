const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config');
const { error } = require('./responses');
const userService = require('../user/user.service');

const openUrls = [
  '/user/login',
  '/user/signup',
  '/user/social-login',
  '/user/googlelogin',
  '/user/forgot-pw',
  '/user/admin/login',
  '/product',
  '/user/verify-email',
  '/user-assessment/public'
];

function authenticateToken(req, res, next) {
  console.log(req.url);
  if (openUrls.indexOf(req.url) !== -1) {
    return next();
  }

  if (req.url.includes('/user/reset-pw/')
    || req.url.includes('/doc/')
    || req.url.includes('/product/search?name=')
    || (req.url.includes('/product/') && req.method === 'GET')
    || (req.url.includes('/user/forgot-pw'))
    || (req.url.includes('/assessment/public'))
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json(error('Unauthorized.', 401));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json(error('Unauthorized.', 401));
    }

    req.user = user;
    return next();
  });
}

async function adminOnly(req, res, next) {
  const user = await userService.getById(req.user.id);

  if (user.type && user.type === 'ADMIN') {
    return next();
  }

  return res.status(403).send(error('Only admins are authorized for this action!', 403));
}

function createToken(info) {
  return jwt.sign(info, JWT_SECRET);
}

module.exports = {
  authenticateToken,
  createToken,
  adminOnly,
};
