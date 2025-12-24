const request = require('supertest');
const app = require('../src/app');
const db = require('../src/database');

describe('TicketBoss API Tests', () => {
  
  beforeEach(() => {
    
    db.reset();
    db.initialize();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /reservations/', () => {
    it('should create a reservation successfully', async () => {
      const response = await request(app)
        .post('/reservations/')
        .send({
          partnerId: 'test-partner',
          seats: 3
        })
        .expect(201);

      expect(response.body).toHaveProperty('reservationId');
      expect(response.body.seats).toBe(3);
      expect(response.body.status).toBe('confirmed');
    });

    it('should reject reservation with invalid seats (0)', async () => {
      const response = await request(app)
        .post('/reservations/')
        .send({
          partnerId: 'test-partner',
          seats: 0
        })
        .expect(400);

      expect(response.body.error).toContain('greater than 0');
    });

    it('should reject reservation with invalid seats (>10)', async () => {
      const response = await request(app)
        .post('/reservations/')
        .send({
          partnerId: 'test-partner',
          seats: 11
        })
        .expect(400);

      expect(response.body.error).toContain('Maximum 10 seats');
    });

    it('should reject reservation without partnerId', async () => {
      const response = await request(app)
        .post('/reservations/')
        .send({
          seats: 3
        })
        .expect(400);

      expect(response.body.error).toContain('partnerId');
    });

    it('should reject reservation without seats', async () => {
      const response = await request(app)
        .post('/reservations/')
        .send({
          partnerId: 'test-partner'
        })
        .expect(400);

      expect(response.body.error).toContain('seats');
    });

    it('should return 409 when not enough seats available', async () => {
    
      const response = await request(app)
        .post('/reservations/')
        .send({
          partnerId: 'test-partner',
          seats: 10
        })
        .expect(201);

    
      for (let i = 0; i < 50; i++) {
        await request(app)
          .post('/reservations/')
          .send({
            partnerId: 'test-partner',
            seats: 10
          });
      }

     
      const failResponse = await request(app)
        .post('/reservations/')
        .send({
          partnerId: 'test-partner',
          seats: 1
        })
        .expect(409);

      expect(failResponse.body.error).toBe('Not enough seats left');
    });
  });

  describe('DELETE /reservations/:reservationId', () => {
    it('should cancel a reservation successfully', async () => {
   
      const createResponse = await request(app)
        .post('/reservations/')
        .send({
          partnerId: 'test-partner',
          seats: 5
        })
        .expect(201);

      const reservationId = createResponse.body.reservationId;

      
      await request(app)
        .delete(`/reservations/${reservationId}`)
        .expect(204);
    });

    it('should return 404 for non-existent reservation', async () => {
      const response = await request(app)
        .delete('/reservations/non-existent-id')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should return 404 when trying to cancel already cancelled reservation', async () => {

      const createResponse = await request(app)
        .post('/reservations/')
        .send({
          partnerId: 'test-partner',
          seats: 5
        })
        .expect(201);

      const reservationId = createResponse.body.reservationId;

      await request(app)
        .delete(`/reservations/${reservationId}`)
        .expect(204);

  
      const response = await request(app)
        .delete(`/reservations/${reservationId}`)
        .expect(404);

      expect(response.body.error).toContain('already cancelled');
    });

    it('should return seats to pool after cancellation', async () => {
    
      const initialResponse = await request(app)
        .get('/reservations/node-meetup-2025')
        .expect(200);

      const initialAvailable = initialResponse.body.availableSeats;

      const createResponse = await request(app)
        .post('/reservations/')
        .send({
          partnerId: 'test-partner',
          seats: 10
        })
        .expect(201);

   
      const afterReservation = await request(app)
        .get('/reservations/node-meetup-2025')
        .expect(200);

      expect(afterReservation.body.availableSeats).toBe(initialAvailable - 10);

      await request(app)
        .delete(`/reservations/${createResponse.body.reservationId}`)
        .expect(204);

     
      const afterCancellation = await request(app)
        .get('/reservations/node-meetup-2025')
        .expect(200);

      expect(afterCancellation.body.availableSeats).toBe(initialAvailable);
    });
  });

  describe('GET /reservations/:eventId', () => {
    it('should return event summary', async () => {
      const response = await request(app)
        .get('/reservations/node-meetup-2025')
        .expect(200);

      expect(response.body).toHaveProperty('eventId', 'node-meetup-2025');
      expect(response.body).toHaveProperty('name', 'Node.js Meet-up');
      expect(response.body).toHaveProperty('totalSeats', 500);
      expect(response.body).toHaveProperty('availableSeats', 500);
      expect(response.body).toHaveProperty('reservationCount', 0);
      expect(response.body).toHaveProperty('version', 0);
    });

    it('should update reservation count correctly', async () => {
     
      await request(app)
        .post('/reservations/')
        .send({ partnerId: 'partner-1', seats: 5 })
        .expect(201);

      await request(app)
        .post('/reservations/')
        .send({ partnerId: 'partner-2', seats: 3 })
        .expect(201);

      // Check summary
      const response = await request(app)
        .get('/reservations/node-meetup-2025')
        .expect(200);

      expect(response.body.availableSeats).toBe(492); // 500 - 5 - 3
      expect(response.body.reservationCount).toBe(8);
      expect(response.body.version).toBe(2); // Two reservations
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/reservations/non-existent-event')
        .expect(404);

      expect(response.body.error).toContain('Event not found');
    });
  });

  describe('Concurrency Control', () => {
    it('should handle multiple concurrent reservations correctly', async () => {
     
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/reservations/')
            .send({
              partnerId: `partner-${i}`,
              seats: 10
            })
        );
      }

      const responses = await Promise.all(promises);

   
      responses.forEach(response => {
        expect([201, 409]).toContain(response.status);
      });

  
      const summary = await request(app)
        .get('/reservations/node-meetup-2025')
        .expect(200);

     
      expect(summary.body.reservationCount + summary.body.availableSeats)
        .toBe(500);
    });
  });
});
