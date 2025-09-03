const express = require('express');
const router = express.Router();

// Basic endpoint for news
router.get('/', (req, res) => {
  res.json({
    message: 'This is a placeholder endpoint for ' + 'news',
    status: 'active'
  });
});

module.exports = router;
