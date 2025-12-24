const express = require('express');
const reservationRoutes = require('./routes/reservations');
const db = require('./database');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});


app.use('/reservations', reservationRoutes);


app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'TicketBoss API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      createReservation: 'POST /reservations/',
      cancelReservation: 'DELETE /reservations/:reservationId',
      eventSummary: 'GET /reservations/:eventId'
    }
  });
});


app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
