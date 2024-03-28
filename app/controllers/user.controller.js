const db = require("../models");
const User = db.users;
const avatars = require("avatars");

exports.generateAndSaveUserInfo = async (req, res) => {
  try {
    const { address, username, avatar, isUpdate } = req.body;

    // Validate address parameter
    if (!address) {
      return res.status(400).json({ message: "Address cannot be empty" });
    }

    // Validate address parameter
    if (isUpdate && (!username || !avatar)) {
      return res
        .status(400)
        .json({ message: "username and avatar cannot be empty" });
    }

    // Update user if isUpdate flag is true
    if (isUpdate) {
      const updatedUser = await User.findOneAndUpdate(
        { address: address },
        { username: username, avatar: avatar },
        { new: true }
      );

      return res.json({ code: 0, msg: "OK", data: updatedUser });
    }

    // Check if user exists
    let userInfo = await User.findOne({ address: address });

    // Return user info if exists
    if (userInfo) {
      return res.json({ code: 0, msg: "OK", data: userInfo });
    }

    // Generate avatar if user does not exist
    const params = {
      seed: address,
      width: 500,
      height: 500,
      pwidth: 15,
      pheight: 15,
      filename: `./avatars/${address}.png`,
    };
    await avatars(params);

    // Generate username based on total user count
    const totalCount = await User.countDocuments();
    const newUser = new User({
      address: address,
      avatar: `${address}.png`,
      username: "satosibet" + (totalCount + 1),
    });

    await newUser.save();

    return res.json({ code: 0, msg: "OK", data: newUser });
  } catch (error) {
    console.error("Error generating and saving user info:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
