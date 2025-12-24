const { v4: uuidv4 } = require('uuid');


class Database {
  constructor() {
    this.events = new Map();
    this.reservations = new Map();
  }

 
  initialize() {
    const seedEvent = {
      eventId: 'node-meetup-2025',
      name: 'Node.js Meet-up',
      totalSeats: 500,
      availableSeats: 500,
      version: 0
    };
    this.events.set(seedEvent.eventId, seedEvent);
    console.log('Database initialized with seed data');
  }

  
  getEvent(eventId) {
    return this.events.get(eventId);
  }

  createReservation(eventId, partnerId, seats) {
    const event = this.events.get(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.availableSeats < seats) {
      return null; 
    }

   
    const newVersion = event.version + 1;
    const updatedEvent = {
      ...event,
      availableSeats: event.availableSeats - seats,
      version: newVersion
    };

 
    const reservationId = uuidv4();
    const reservation = {
      reservationId,
      eventId,
      partnerId,
      seats,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

  
    this.events.set(eventId, updatedEvent);
    this.reservations.set(reservationId, reservation);

    return reservation;
  }


  cancelReservation(reservationId) {
    const reservation = this.reservations.get(reservationId);
    
    if (!reservation) {
      return false;
    }

    if (reservation.status === 'cancelled') {
      return false; 
    }

    const event = this.events.get(reservation.eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

   
    const updatedEvent = {
      ...event,
      availableSeats: event.availableSeats + reservation.seats,
      version: event.version + 1
    };

    const updatedReservation = {
      ...reservation,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    };

    this.events.set(reservation.eventId, updatedEvent);
    this.reservations.set(reservationId, updatedReservation);

    return true;
  }

  
  getReservation(reservationId) {
    return this.reservations.get(reservationId);
  }

 
  getEventReservations(eventId) {
    return Array.from(this.reservations.values())
      .filter(r => r.eventId === eventId && r.status === 'confirmed');
  }

 
  getEventSummary(eventId) {
    const event = this.events.get(eventId);
    
    if (!event) {
      return null;
    }

    const activeReservations = this.getEventReservations(eventId);
    const reservationCount = activeReservations.reduce((sum, r) => sum + r.seats, 0);

    return {
      eventId: event.eventId,
      name: event.name,
      totalSeats: event.totalSeats,
      availableSeats: event.availableSeats,
      reservationCount,
      version: event.version
    };
  }

 
  reset() {
    this.events.clear();
    this.reservations.clear();
  }
}


const db = new Database();

module.exports = db;
