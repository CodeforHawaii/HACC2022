/**
 * GET /
 * URLs page.
 */
 exports.index = (req, res) => {
    res.render('urls', {
      title: 'URLs'
    });
  };
  