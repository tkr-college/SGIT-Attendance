const { getDistance } = require('geolib');

function isWithinOffice(lat, lng) {
  const officeLat = parseFloat(process.env.OFFICE_LAT);
  const officeLng = parseFloat(process.env.OFFICE_LNG);
  const radius = parseFloat(process.env.OFFICE_RADIUS_METERS || '200');

  if (Number.isNaN(officeLat) || Number.isNaN(officeLng)) return true; // geofencing disabled if not configured

  const distance = getDistance(
    { latitude: lat, longitude: lng },
    { latitude: officeLat, longitude: officeLng }
  );
  return { allowed: distance <= radius, distance, radius };
}

module.exports = { isWithinOffice };
