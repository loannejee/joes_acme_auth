const jwt = require("jsonwebtoken");


// console.log(
//     jwt.sign({name: "Penny"}, "buttons")
// );


// NOTES:
// "buttons" is the secretOrPrivateKey second parameter that controls the algorithm aka information that gives the extra direction for scrambling 



// TO SCRAMBLE
// jwt.sign(payload, secretOrPrivateKey, [options, callback])
const token = jwt.sign({name: "Penny"}, "buttons")

// TO UNSCRAMBLE
// jwt.verify(token, secretOrPublicKey, [options, callback])
