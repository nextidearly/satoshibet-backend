const db = require("../models");
const Holder = db.holders;

// Retrieve holders and inscriptions with pagination
exports.getHoldersAndInscriptions = async (req, res) => {
  try {
    // Validate request parameters
    const { start, limit, address, inscriptionId } = req.body;
    if (
      start === undefined ||
      start === null ||
      limit === undefined ||
      limit === null
    ) {
      return res
        .status(400)
        .send({ message: "Start and limit cannot be empty" });
    }

    // Construct query object
    const query = {};
    if (address) {
      query.address = address;
    }
    if (inscriptionId) {
      query.inscriptionId = inscriptionId;
    }

    // Get total number of holders
    const totalCount = await Holder.countDocuments(query);

    // Retrieve holders with pagination
    const data = await Holder.find(query)
      .skip(parseInt(start))
      .limit(parseInt(limit))
      .exec();

    // Send response
    res.json({
      code: 0,
      msg: "OK",
      data: {
        total: totalCount,
        list: data,
      },
    });
  } catch (error) {
    console.error("Error retrieving holders and inscriptions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
