const express = require('express');
const app = express();
const axios = require('axios').default;
const basicAuth = require('express-basic-auth');
const port = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const randomstring = require('randomstring');
const base64url = require('base64url');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(cookieParser());

// GLOBAL VARIABLES
var thinkificSub = '';
var tokenValidation;

// CRYPTO MODULE
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const initVector = crypto.randomBytes(16);
const Securitykey = crypto.randomBytes(32);

// ENCRYPT TOKEN
function encryptToken(token) {
  const cipher = crypto.createCipheriv(algorithm, Securitykey, initVector);
  let encryptedData = cipher.update(token, 'utf-8', 'hex');
  encryptedData += cipher.final('hex');
  return encryptedData;
}

// DECRYPT TOKEN
function decryptToken(encryptedToken) {
  const decipher = crypto.createDecipheriv(algorithm, Securitykey, initVector);
  let decryptedData = decipher.update(encryptedToken, 'hex', 'utf-8');
  decryptedData += decipher.final('utf8');
  return decryptedData;
}

// ENV VARIABLES
require('dotenv').config();
process.env.CLIENT_KEY;
process.env.CLIENT_SECRET;
process.env.NODE_ENV;

//INDEX - HOME PAGE
app.get('/', (req, res) => {
  if (req.cookies.token == null) {
    tokenValidation = false;
    res.render('pages/index', {
      tokenValidation: tokenValidation,
    });
  } else {
    tokenValidation = true;
    res.render('pages/index', {
      tokenValidation: tokenValidation,
    });
  }
});

app.post('/', (req, res) => {
  var installSub = req.body.subdomain.split('.');
  res.redirect(`http://localhost:${port}/install?subdomain=${installSub[0]}`);
});

// INSTALL URL
app.get('/install', (req, res) => {
  // GENERATE RANDOM STRING FOR CODE VERIFIER
  const code_verifier = randomstring.generate(128);
  const base64Digest = crypto
    .createHash('sha256')
    .update(code_verifier)
    .digest('base64');

  // HASHED CODE VERIFIER VIA S256 METHOD & BASE64 ENCODE
  const code_challenge = base64url.fromBase64(base64Digest);
  const state = code_verifier;
  const subdomain = req.query.subdomain;
  const redirect_uri = `http://localhost:${port}/authcodeflow`;
  thinkificSub = `https://${subdomain}.thinkific.com`;

  res.redirect(
    `https://${subdomain}.thinkific.com/oauth2/authorize?client_id=${process.env.CLIENT_KEY}&redirect_uri=${redirect_uri}&state=${state}&response_type=code&code_challenge=${code_challenge}&code_challenge_method=S256`
  );
});

// CALLBACK URL
app.get('/authcodeflow', (req, res) => {
  // BODY PARAMETERS
  const json = JSON.stringify({
    grant_type: 'authorization_code',
    code: req.query.code,
    code_verifier: req.query.state,
  });

  // BASE64 ENCODE CLIENT_ID AND CLIENT KEY
  const authKey = Buffer.from(
    process.env.CLIENT_KEY + ':' + process.env.CLIENT_SECRET
  ).toString('base64');

  // RETRIEVE ACCESS TOKEN
  axios
    .post(thinkificSub + '/oauth2/token', json, {
      headers: {
        Authorization: 'Basic ' + authKey,
        'Content-Type': 'application/json',
      },
    })
    .then((response) => {
      return (
        res.cookie('token', encryptToken(response.data.access_token), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        }),
        res.redirect(`http://localhost:${port}/app`)
      );
    })
    .catch((error) => res.send(error));
});

// APP URL
app.get('/app', (req, res) => {
  if (req.cookies.token == null) {
    tokenValidation = false;
    res.render('pages/app', {
      tokenValidation: tokenValidation,
    });
  } else {
    tokenValidation = true;
    res.render('pages/app', {
      tokenValidation: tokenValidation,
    });
  }
});

// API REQUEST ON POST
app.post('/app', (req, res) => {
  var method = req.body.method;
  var baseUrl = req.body.baseUrl;
  var bodyParams = req.body.bodyParams;

  // BASE64 ENCODE CLIENT_ID AND CLIENT KEY
  const authKey = Buffer.from(
    process.env.CLIENT_KEY + ':' + process.env.CLIENT_SECRET
  ).toString('base64');

  // MAKE THE API CALL
  const sendRequest = async () => {
    try {
      const resp = await axios({
        method: method,
        url: baseUrl,
        headers: {
          Authorization: 'Bearer ' + decryptToken(req.cookies.token),
          'Content-Type': 'application/json',
        },
        data: bodyParams,
      });
      var respData = resp.data.items;
      res.render('pages/response', {
        respData: respData,
      });
    } catch (error) {
      var errorMessage = error.message;
      if (errorMessage.includes('401')) {
        res.render('pages/error', {
          errorMessage: errorMessage,
        });
      } else {
        res.render('pages/error', {
          errorMessage: errorMessage,
        });
      }
    }
  };
  sendRequest();
});

app.get('/token', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// SERVER PORT
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
