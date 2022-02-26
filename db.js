const jwt = require("jsonwebtoken");
const Sequelize = require('sequelize');
const bcrypt = require("bcrypt");
const { BelongsTo } = require("sequelize");
const dotenv = require('dotenv').config()
const { STRING } = Sequelize;
const config = {
    logging: false
};


if (process.env.LOGGING) {
    delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
    username: STRING,
    password: STRING
});

const Note = conn.define('note', {
  text: Sequelize.STRING  
})

Note.belongsTo(User);
User.hasMany(Note);

const secretSigningPhrase = process.env.AUTH_JWT_SECRET;
// console.log("secret", secretSigningPhrase)

User.byToken = async (token) => {
    try {
        const unscrambledToken = jwt.verify(token, secretSigningPhrase);
        console.log("unscrambled", unscrambledToken)
        const user = await User.findByPk(unscrambledToken.userId);
        if (user) {
            return user;
        }
        const error = Error('bad credentials');
        error.status = 401;
        throw error;
    }
    catch (ex) {
        console.log(ex);
        const error = Error('bad credentials');
        error.status = 401;
        throw error;
    }
};

User.authenticate = async ({ username, password }) => {
    // username = lucy
    // password = lucy_pws
    const user = await User.findOne({
        where: {
            username
        }
    });
        console.log("whats our user?", user)
    if (!user) {
        const error = Error('bad credentials');
        error.status = 401;
        throw error;
    }

    const passwordsMatch = bcrypt.compareSync(password, user.password);

    if (passwordsMatch) {
        //to create new token jwt.sign(payload, sign/secret key, [options])
        const newToken = jwt.sign({ userId: user.id }, secretSigningPhrase);
        console.log("new token", newToken)
        return newToken; // token
        
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
};

const syncAndSeed = async () => {
    await conn.sync({ force: true });
    const credentials = [
        { username: 'lucy', password: bcrypt.hashSync('lucy_pw', 10) },
        { username: 'moe', password: bcrypt.hashSync('moe_pw', 10) },
        { username: 'larry', password: bcrypt.hashSync('larry_pw', 10) }
    ];
    const [lucy, moe, larry] = await Promise.all(
        credentials.map(credential => User.create(credential))
    );
    console.log("lucy", lucy)
    const notes = [
        { userId: 1, text: "Lucy is a silly goosey"},
        { userId: 2, text: "Gotta go to Moe's"},
        { userId: 3, text: "Larry licks lollipops"},
    ];

    const [first, second, third] = await Promise.all(
        notes.map(note => Note.create(note))
    );
        console.log("is this right?", first)

    return {
        users: {
            lucy,
            moe,
            larry
        },
        notes: {
            first,
            second,
            third
        }
    };
};

module.exports = {
    syncAndSeed,
    models: {
        User,
        Note
    }
};
