const express = require('express');
const router = express.Router();
const db = require('../database');
const { validateReservationRequest, validateReservationId } = require('../middleware/validation');

router.post('/', validateReservationRequest, async (req, res) => {
  try {
    const { partnerId, seats } = req.body;
    const eventId = 'node-meetup-2025'; 

   
    const reservation = db.createReservation(eventId, partnerId, seats);

    if (!reservation) {
      // Not enough seats available
      return res.status(409).json({
        error: 'Not enough seats left'
      });
    }

    
    return res.status(201).json({
      reservationId: reservation.reservationId,
      seats: reservation.seats,
      status: reservation.status
    });

  } catch (error) {
    console.error('Error creating reservation:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});


router.delete('/:reservationId', validateReservationId, async (req, res) => {
  try {
    const { reservationId } = req.params;

    // Check if reservation exists
    const reservation = db.getReservation(reservationId);
    
    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found'
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(404).json({
        error: 'Reservation already cancelled'
      });
    }

   
    const success = db.cancelReservation(reservationId);

    if (success) {
      return res.status(204).send();
    } else {
      return res.status(404).json({
        error: 'Failed to cancel reservation'
      });
    }

  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});


router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const summary = db.getEventSummary(eventId);

    if (!summary) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    return res.status(200).json(summary);

  } catch (error) {
    console.error('Error fetching event summary:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
