require('dotenv').config();

const app = require('./app');

const port = process.env.PORT || 3005;

app.listen(port);
console.log(`API server started on: ${port}`);
