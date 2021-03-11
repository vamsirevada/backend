const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server Started on port ${PORT}`));

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(bodyParser.json());
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
app.use('/api', require('./routes/api/search'));

//endpoint
app.get('/api', (req, res) => res.send('API Running...!'));
