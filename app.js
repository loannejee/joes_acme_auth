const express = require('express');
const app = express();
app.use(express.json());
const { models: { User, Note } } = require('./db');
const path = require('path');

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// LOGIN/SIGNIN AUTHENTICATE USER
app.post('/api/auth', async (req, res, next) => {
    // req.body = { username: "lucy", password: "lucy_pw" }
    try {
        res.send({ token: await User.authenticate(req.body) });
    }
    catch (ex) {
        next(ex);
    }
});

app.get('/api/auth', async (req, res, next) => {
    try {
        res.send(await User.byToken(req.headers.authorization));
    }
    catch (ex) {
        next(ex);
    }
});


// NOTES

app.get('/api/auth/:id/notes', async (req, res, next) => {
    try {
        const notes = await Note.findByPk((req.params.id), {
            include: [User]
        })
        res.send(notes)
    } catch(e) {
        next(e)
    }
})



app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;