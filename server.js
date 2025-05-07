require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

const WOOCOMMERCE_API_BASE_URL = "https://natasha12c4033c0a.wpcomstaging.com/wp-json/wc/v3";
const CONSUMER_KEY = "ck_8f2166ff7faac63ecc14f70da19e774a45de1af2"; // Replace with your actual consumer key
const CONSUMER_SECRET = "cs_14a692c7a1fab65710ee9be83efdff4b78dbd949"; // Replace with your actual consumer secret


// add this WooCommerce client
const wcAxios = axios.create({
  baseURL: WOOCOMMERCE_API_BASE_URL,                // e.g. https://your-site.com/wp-json/wc/v3
  auth: {
    username: CONSUMER_KEY,          // set in .env
    password: CONSUMER_SECRET,       // set in .env
  },
});

// Enable CORS for all domains
app.use(cors({origin:'https://nt-bms.com'}));

// Middleware to parse JSON requests
app.use(express.json());

// POST route to create a payment with Revolut
app.post('/api/revolut/create-order', async (req, res) => {
  try {
    const { orderId, amount, customerEmail } = req.body;

    const response = await axios.post(
      'https://merchant.revolut.com/api/1.0/orders',  
      // 'https://sandbox-merchant.revolut.com/api/1.0/orders',  
      {
        amount: Math.round(amount * 100),
        currency: "EUR",
        capture_mode: "AUTOMATIC",
        merchant_order_ext_ref: `${orderId}`,
        description: `Order #${orderId}`,
        customer_email: customerEmail,
        // return_url: "http://localhost:8080/payment-success",
        // cancel_url: "http://localhost:8080/payment-cancel",
        return_url: "https://nt-bms.com/payment-success",
        cancel_url: "https://nt-bms.com/payment-cancel",
      },
      {
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json', 
          // 'Authorization': 'Bearer sk_tDwALNOovPmT_dmVsMshppc0D79amZWflnftb9jpzquNtT7sQ_Fb3Re7PRJvgLnl'  // sandbox
          'Authorization': 'Bearer sk_dwCsVOn-WgUpZqfWQ1MMemgb5-xYBxS_2VE0_PIfPLskwUPt2i9GE5CQI4SBdl3m' // original
        },
      }
    );

    console.log(response.data)

    // Extract and send only the checkout URL
    const checkoutUrl = response.data.checkout_url;
    const payment_id = response.data.id;
    res.json({ checkoutUrl, payment_id });
  } catch (error) {
    console.error('Error processing payment:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

app.get('/api/revolut/check-order-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const response = await axios.get(
      // `https://sandbox-merchant.revolut.com/api/1.0/orders/${orderId}`,
      `https://merchant.revolut.com/api/1.0/orders/${orderId}`,
      
      { headers: { 
          'Accept': 'application/json',
          // 'Authorization': 'Bearer sk_tDwALNOovPmT_dmVsMshppc0D79amZWflnftb9jpzquNtT7sQ_Fb3Re7PRJvgLnl' // sandbox
          'Authorization': 'Bearer sk_dwCsVOn-WgUpZqfWQ1MMemgb5-xYBxS_2VE0_PIfPLskwUPt2i9GE5CQI4SBdl3m' // original

      }}
    );

    // console.log(response.data);
    // grab Revolut’s state and your Woo order ID (ext_ref)
    const { state, merchant_order_ext_ref: wooOrderId, ...details } = response.data;

    console.log(wooOrderId, state)
    // CORRECT comparison & update WooCommerce
    if (state === "COMPLETED") {
      await wcAxios.put(`/orders/${wooOrderId}`, { status: "completed" });
    }

    res.json({ status: state, details });
  } catch (error) {
    console.error('Error fetching order status:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

// Set the port for the backend server
const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
