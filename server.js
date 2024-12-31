require('dotenv').config();
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');

const port = 4003;

// Initialize express
const app = express();
app.use(bodyParser.json());  // parsing JSON bodies

const username = process.env.MPESA_CONSUMER_KEY;
const password = process.env.MPESA_CONSUMER_SECRET;

// Get Access Token function
async function getAccessToken() {

  const encodedAuth = Buffer.from(`${username}:${password}`).toString('base64');

  try {
    const response = await axios({
      method: 'get',
      url: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      // url: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      headers: {
        'Authorization': `Basic ${encodedAuth}`,
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

// STK Push initiation function
async function initiateSTKPush() {
  const token = await getAccessToken();
  const buscode = process.env.BUSINESS_SHORTCODE;
  const passkey = process.env.PASSKEY;
  const timestamp = moment().tz('Africa/Nairobi').format('YYYYMMDDHHmmss');

  const encPass = Buffer.from(`${buscode}${passkey}${timestamp}`).toString('base64');

  // const lipaShortcode = process.env.MPESA_LIPA_NA_MPESA_ONLINE;
  // const lipaShortcodePassword = process.env.MPESA_SHORTCODE_PASSWORD;
  const phoneNumber = process.env.MPESA_PHONE_NUMBER;  
  const accNumber = process.env.ACCOUNT_NUMBER;
  // const amount = process.env.AMOUNT;  
  const callbackUrl = process.env.MPESA_CALLBACK_URL;  

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const body = {
    BusinessShortcode: buscode,
    Password: encPass,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    // LipaNaMpesaOnlineShortcode: lipaShortcode,
    // ShortcodePassword: lipaShortcodePassword,
    PartyA: phoneNumber,
    PhoneNumber: phoneNumber,
    Amount: 1,
    PartyB: buscode,
    CallBackURL: callbackUrl,
    AccountReference: accNumber,
    TransactionDesc: 'Test transaction Push',
  };

  try {
    const response = await axios({
      method: 'POST',
      url: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      // url: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      headers: headers,
      data: body,
    });

    console.log('STK Push Response:', response.data);
  } catch (error) {
    console.error('Error initiating STK Push:', error);
  }
}

// Handle the callback from Safaricom after payment attempt
app.post('api-test/callback', (req, res) => {
  const paymentResponse = req.body;
  console.log('Payment Callback Response:', paymentResponse);

  // here you can add more processes and update your database or perform other actions here.

  res.status(200).send('Callback received');
});

app.get('/init', (req, res) => {
      // initiate the STK Push
  initiateSTKPush();
  console.log('ínitiated PUSH');
  res.status(200).send('initiated push');
  
})

// Start the local server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
