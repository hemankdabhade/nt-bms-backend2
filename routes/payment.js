const express = require('express');
const axios = require('axios');
const app = express();

// Assuming you have middleware to parse JSON requests
app.use(express.json());

app.post('/api/revolut-payment', async (req, res) => {
  try {
    const { orderId, amount, customerEmail } = req.body;
    
    const response = await axios.post(
      'https://merchant.revolut.com/api/1.0/orders',
      {
        amount: Math.round(amount * 100),  // convert to cents
        currency: "EUR",                   // Assuming EUR for currency
        capture_mode: "AUTOMATIC",         // You can change this to "MANUAL" if needed
        merchant_order_ext_ref: `${orderId}`,  // Make sure this is correctly formatted
        description: "Order #" + orderId,  // Description of the order
        customer_email: customerEmail,
        return_url: "https://localhost:8080/payment-success",
        cancel_url: "https://localhost:8080/payment-cancel",
      },
      {
        headers: {
          Authorization: `Bearer YOUR_REVOLUT_API_KEY`,  // Replace with your Revolut API key
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);  // Send back the Revolut API response (payment URL)
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Start your server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
