const express = require('express');
const User = require('./routesUser');
const router = express.Router();

// colocar las rutas aquí
router.use(User);


module.exports = router;