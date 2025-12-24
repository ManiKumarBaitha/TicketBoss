
function validateReservationRequest(req, res, next) {
  const { partnerId, seats } = req.body;


  if (!partnerId) {
    return res.status(400).json({
      error: 'partnerId is required'
    });
  }

  if (seats === undefined || seats === null) {
    return res.status(400).json({
      error: 'seats is required'
    });
  }


  if (typeof seats !== 'number' || !Number.isInteger(seats)) {
    return res.status(400).json({
      error: 'seats must be an integer'
    });
  }

  if (seats <= 0) {
    return res.status(400).json({
      error: 'seats must be greater than 0'
    });
  }

  if (seats > 10) {
    return res.status(400).json({
      error: 'Maximum 10 seats per request'
    });
  }

  next();
}


function validateEventId(req, res, next) {
  const { eventId } = req.params;

  if (!eventId) {
    return res.status(400).json({
      error: 'eventId is required'
    });
  }

  next();
}


function validateReservationId(req, res, next) {
  const { reservationId } = req.params;

  if (!reservationId) {
    return res.status(400).json({
      error: 'reservationId is required'
    });
  }

  next();
}

module.exports = {
  validateReservationRequest,
  validateEventId,
  validateReservationId
};
