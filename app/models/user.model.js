module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {
      address: {
        type: String,
        required: true,
        unique: true,
      },
      avatar: String,
      username: String,
    },
    { timestamps: true }
  );

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const User = mongoose.model("user", schema);
  return User;
};
