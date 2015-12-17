var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', hostname: req.headers.host });
});

router.get(['/slyde.js/:token', '/slyde.js'], function(req, res, next) {
	res.set({
		  'Content-Type': 'application/javascript',
	});
  res.render('slyde.js-ejs', {
		hostname: req.headers.host, token: req.params.token
	});
});

module.exports = router;
