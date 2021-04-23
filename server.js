const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const https = require('https');
const fs = require('fs');
const privateKey = fs.readFileSync('/etc/ssl/certs/vanity_ac_private.key');
const certificate = fs.readFileSync('/etc/ssl/certs/vanity_ac.crt');

const credentials = {
  key: privateKey,
  cert: certificate,
};

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, () => console.log(`Server Started on port ${PORT}`));

dotenv.config();

const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => console.log(`Server Started on port ${PORT}`));

app.use(express.json({}));
app.use(cors());

//Connect Database
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('MongoDB Connected...');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// Define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/projectpost', require('./routes/api/projectpost'));
app.use('/api/project', require('./routes/api/project'));
app.use('/api/notice', require('./routes/api/notice'));
app.use('/api/article', require('./routes/api/article'));
app.use('/api/password', require('./routes/api/password'));
app.use('/api/expense', require('./routes/api/expense'));

//endpoint
app.get('/api', (req, res) => res.send('API Running...!'));
