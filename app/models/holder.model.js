module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {
      address: {
        type: String,
        required: true,
      },
      inscriptionId: {
        type: String,
        required: true,
        unique: true,
      },
    },
    { timestamps: true }
  );

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Holder = mongoose.model("holder", schema);
  return Holder;
};
