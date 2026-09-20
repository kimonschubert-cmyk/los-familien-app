module.exports = function (req, res) {
res.status(200).json({
status: String.fromCharCode(111,107),
message: String.fromCharCode(76,79,83,32,65,80,73,32,102,117,110,107,116,105,111,110,105,101,114,116)
});
};
