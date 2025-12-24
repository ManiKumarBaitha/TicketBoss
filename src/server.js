require('dotenv').config();
const app = require('./app');
const db = require('./database');

const PORT = process.env.PORT || 3000;


db.initialize();


const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('TicketBoss API Server');
  console.log('='.repeat(50));
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Base URL: http://localhost:${PORT}`);
  console.log('='.repeat(50));
  console.log('\nAvailable Endpoints:');
  console.log(`  POST   http://localhost:${PORT}/reservations/`);
  console.log(`  DELETE http://localhost:${PORT}/reservations/:reservationId`);
  console.log(`  GET    http://localhost:${PORT}/reservations/:eventId`);
  console.log(`  GET    http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});


process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = server;
