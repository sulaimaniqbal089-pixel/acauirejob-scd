// Every successful API response has the same shape:
//   { success: true, message: '...', data: {...} }
function sendSuccess(res, data = {}, message = '', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

module.exports = { sendSuccess };
