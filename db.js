// 1. npm install --save jsonwebtoken bcrypt
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Sequelize = require('sequelize');

// 4.b This is a lightweight npm package that automatically loads environment variables from a .env file into the process.env object.
const dotenv = require("dotenv").config();

const { STRING } = Sequelize;
const config = {
    logging: false
};

if (process.env.LOGGING) {
    delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_auth', config);

// 2. DATABASE MODELS ARE HERE:
const User = conn.define('user', {
    username: STRING,
    password: STRING
});

const Note = conn.define('note', {
    text: Sequelize.STRING  
})



// ASSOCIATIONS HERE
Note.belongsTo(User);
User.hasMany(Note);



// 4. ENVIRONMENT VARIABLE HERE - OUR SECRET KEY
// 4a. Create .env file and create the AUTH_JWT_SECRET
// 4b. See line 6
const secretSigningPhrase = process.env.AUTH_JWT_SECRET;


// 3. CLASS METHODS ==============================================================================
// this should find a user with the given username and determine if the password is valid for them
User.byToken = async (token) => {
    try {
        // unscramble the token and get the id
        const unscrambledToken = jwt.verify(token, secretSigningPhrase);
        // find the user by id
        const user = await User.findByPk(unscrambledToken.userId);
        // if user exist in the db, return it/allow access 
        if (user) {
            return user;
        }
        // else tell em to scraam
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

// this should find a user with the given username and determine if the password is valid for them
User.authenticate = async ({ username, password }) => {
    // username = lucy
    // password = lucy_pws
    const user = await User.findOne({
        where: {
            username
        }
    });

    if (!user) {
        const error = Error('bad credentials');
        error.status = 401;
        throw error;
    }
    
    // 5. BCRYPT
    // bcrypt does the hashing
    // passwordsMatch = true or false
    const passwordsMatch = bcrypt.compareSync(password, user.password);

    if (passwordsMatch) {
        // Sign takes a payload which is what we want to serialize
        // We want to serialize the "userId" with the sercret key which is the second parameter that we declared "secretSigningPhrase"
        const newToken = jwt.sign({ userId: user.id }, secretSigningPhrase);
        return newToken; // token
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
};


// SEEDING HERE
const syncAndSeed = async () => {
    await conn.sync({ force: true });
    const credentials = [
        // 5. BCRYPT
        // saltRounds = 10
        // 10 rounds of hashing
        { username: 'lucy', password: bcrypt.hashSync('lucy_pw', 10) },
        { username: 'moe', password: bcrypt.hashSync('moe_pw', 10) },
        { username: 'larry', password: bcrypt.hashSync('larry_pw', 10) }
    ];
    const [lucy, moe, larry] = await Promise.all(
        credentials.map(credential => User.create(credential))
    );

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
        },
    };
};

module.exports = {
    syncAndSeed,
    models: {
        User,
        Note
    }
};
