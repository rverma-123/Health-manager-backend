const express = require('express');
const router = express.Router();

const { 
    login,
    signup,
} = require ('../controllers/Auth.js');

//router for login
// router.post('/login', login );
router.post('/login', login)

//router for singup
router.post('/signup', signup)

module.exports = router
