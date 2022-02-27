const { syncAndSeed } = require('./db');
const app = require('./app');

const init = async () => {
    await syncAndSeed();
    const port = process.env.PORT || 8080;
    app.listen(port, () => console.log(`listening on port ${port}`));
};

init();

// Note:
// npm run start:dev runs this file which seeds db AND start up the port