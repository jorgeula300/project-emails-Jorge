const catchError = require('../utils/catchError');
const User = require('../models/User.models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const EmailCode = require('../models/EmailCode.models');

const getAll = catchError(async(req, res) => {
    const results = await User.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {
    const { email, password, firstName, lastName, country,  image,  isVerified,frontBaseUrl } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        country,
        image,
        isVerified
    });

    const code = require('crypto').randomBytes(32).toString('hex');
    const verifyUrl = `${frontBaseUrl}/${code}`;
    await EmailCode.create({
        code,
        userId: result.id
    })
    await sendEmail({
        to: email,
        subject: "REGISTRO",
        html: `<h1>Bienvenido ${firstName} ${lastName}</h1>
        <p>gracias por crear tu cuenta con nosotros</p>
        <p>Para verificar tu cuenta haz click en el siguiente enlace</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        `
    })

    return res.status(201).json(result);
});

const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await User.findByPk(id);
    if(!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    await User.destroy({ where: {id} });
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const { email, firstName, lastName, country,  image,  isVerified } = req.body;
    const result = await User.update(
        {email, firstName, lastName, country,  image,  isVerified },
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});

const login = catchError(async(req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({where: {email}});
    if(!user) return res.status(401).json({message: "Invalid credentials"});
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) return res.status(401).json({message: "Invalid credentials"});
    const token = jwt.sign({user}, process.env.TOKEN_SECRET, {expiresIn: '1d'});
    return res.json({user,token});
});

const verifyEmail = catchError(async(req, res) => {
    const { code } = req.params;

    const emailCode = await EmailCode.findOne({where: {code}});
    if(!emailCode) return res.status(401).json({message: "Invalid code"});
    const user = await User.findByPk(emailCode.userId);
    if(!user) return res.status(404).json({message: "User not found"});
    user.isVerified = true;
    await user.save();
    await emailCode.destroy();
    return res.json({message: "Email verified",
        user
    });
});

const resetPassword = catchError(async(req, res) => {
    const { email, frontBaseUrl } = req.body;
    const user = await User.findOne({where: {email}});
    if(!user) return res.status(401).json({message: "Invalid user"});
    const code = require('crypto').randomBytes(32).toString('hex');
    const verifyUrl = `${frontBaseUrl}/${code}`;
    await EmailCode.create({
        code,
        userId: user.id
    })
    return res.json({message: "Email sent",
        verifyUrl
    });
});

const resetPassword2 = catchError(async(req, res) => {
    const { password } = req.body;
    const { code } = req.params;
    const emailCode = await EmailCode.findOne({where: {code}});
    if(!emailCode) return res.status(401).json({message: "Invalid code"});
    const user = await User.findByPk(emailCode.userId);
    if(!user) return res.status(404).json({message: "User not found"});
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    await emailCode.destroy();
    return res.json({message: "Password updated",
        user
    });
});


module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update,
    login,
    verifyEmail,
    resetPassword,
    resetPassword2
}