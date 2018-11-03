'use strict';

var express     = require('express');
var bodyParser  = require('body-parser');
var expect      = require('chai').expect;
var cors        = require('cors');
const helmet    = require('helmet');
const mongoose  = require('mongoose');

var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');

var app = express();

require('dotenv').load();

app.use(helmet());

app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if(process.env.NODE_ENV == 'test') {
  app.use((req, res, next) => {
    let meth = req.method;
    let path = req.path;
    let ip = req.ip;
    let body = JSON.stringify(req.body);
    let query = JSON.stringify(req.query);
    let params = JSON.stringify(req.params);
    let response = JSON.stringify(Object.assign({},res.body, res.status, res.headers), null, 2);
    console.log(response);
    console.log(`${meth} ${path} - ${body} ${query} ${params}`);
    next();
  });
}

mongoose.connect(
    process.env.MONGODB_URI,
    (err, db) => {
        if (err) console.log('DB Error');
        if (db) console.log('Connected to MLAB mongo instance');
    }
);

//Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);

//Sample Front-end

    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port " + process.env.PORT);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        var error = e;
          console.log('Tests are not valid:');
          console.log(error);
      }
    }, 1500);
  }
});

module.exports = app; //for testing
