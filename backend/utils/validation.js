const isMissing = (value) =>
  value === undefined || value === null || value === "";

const requireFields = (res, fields, message = "Missing required fields") => {
  const missing = Object.keys(fields).filter((key) => isMissing(fields[key]));
  if (missing.length > 0) {
    res.status(400).json({ message });
    return false;
  }
  return true;
};

module.exports = { requireFields };
