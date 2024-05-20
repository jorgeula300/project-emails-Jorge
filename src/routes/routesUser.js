const { getAll, create, getOne, remove, update, login, verifyEmail, resetPassword, resetPassword2 } = require('../controllers/user.controllers');
const express = require('express');
const verifyJWT = require('../utils/verifyJWT.JS');
const { reset } = require('nodemon');


const routesUser = express.Router();

routesUser.route('/users')
    .get(verifyJWT, getAll)
    .post(create);

routesUser.route('/users/login')
    .post(login);

routesUser.route('/users/verify/:code')
    .get(verifyEmail)

routesUser.route('/users/reset_password')
    .post(resetPassword)

routesUser.route('/users/reset_password/:code')
    .post(resetPassword2)

routesUser.route('/users/:id')
    .get(verifyJWT, getOne)
    .delete(verifyJWT, remove)
    .put(verifyJWT, update);

module.exports = routesUser;