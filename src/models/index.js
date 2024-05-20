const User = require('./User.models');
const EmailCode = require('./EmailCode.models');

EmailCode.belongsTo(User);
User.hasOne(EmailCode);