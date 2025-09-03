const express = require('express');
const router = express.Router();

// Basic endpoint for newsRoutes
router.get('/', (req, res) => {
  res.json({
    message: 'This is a placeholder endpoint for ' + 'newsRoutes',
    status: 'active'
  });
});

module.exports = router;
