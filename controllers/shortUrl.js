const Url = require('../models/Url')
Url.collection.createIndex({ slug: 1 }, { unique: true })
const { isUrlValid } = require('../utils/utils')
const dns = require('dns');
const fetch = require('node-fetch');


//* @route   POST /shorten
//* @desc    Create short URL
//* @access  Public

async function lookupPromise(domain) {
  return new Promise((resolve, reject) => {
    dns.lookup(domain, (err, address, family) => {
      if (err) reject(err);
      resolve(address);
    });
  });
};


exports.checkURL = (req, res) => {
  const { longUrl } = req.body;
  const {status, message} = isUrlValid(longUrl)
  if(status === 401){
    return res.status(401).json({
      error: true,
      message: 'Invalid Url'
    });
  }
  if(status === 400){
    return res.status(400).json({
      error: true,
      message: message
    });
  }
  return true;

}

exports.postShortUrl = async (req, res) => {
  const base = process.env.BASE_URL
  const { nanoid } = await import('nanoid');
  let { slug, longUrl, user } = req.body;

  const {status, message} = isUrlValid(longUrl)
  if(status === 401){
    return res.json({
      error: true,
      message: 'Invalid Url',
      status: 401
    });
  }
  if(status === 400){
    return res.json({
      error: true,
      message: message,
      status: 400
    });
  }

  const ipAddress = await lookupPromise(new URL(longUrl).hostname);

  const response = await fetch(`http://ip-api.com/json/${ipAddress}`);

  const { country, countryCode } = await response.json();

  try {
    const queryParams = {
      longUrl,
      user
    };

    if (slug) {
      queryParams[slug] = slug;
    }

    let url = await Url.findOne(queryParams)
    if (url) {
      return res.json(url)
    } else {
      const id = nanoid(7);
      const shortUrl = `${base}/${slug || id}`;

      url = new Url({
        slug: slug || id,
        longUrl,
        shortUrl,
        date: new Date(),
        user,
        ipAddress,
        country,
        countryCode
      });

      await url.save();
      return res.json(url);
    }
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      error: true,
      message: 'Server Error'
    });
  }
}

exports.getShortUrl = async (req, res) => {
  const { slug } = req.params;
  try {
    const url = await Url.findOne({ slug });
    if (url) {
      url.clickCounter++;
      await url.save();
      return res.redirect(url.longUrl);
    } else {
      return res.status(404).json({ message: 'Url not found' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}
