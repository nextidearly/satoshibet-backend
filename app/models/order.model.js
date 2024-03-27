module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {
      ordinalName: {
        type: Number,
        required: true,
        unique: true,
      },
      orderId: {
        type: String,
        required: true,
        unique: true,
      },
      status: String,
      payAddress: String,
      receiveAddress: String,
      amount: Number,
      paidAmount: Number,
      outputValue: Number,
      feeRate: Number,
      minerFee: Number,
      serviceFee: Number,
      files: [
        {
          filename: String,
          status: String,
          size: Number,
          inscriptionId: String,
        },
      ],
      count: Number,
      pendingCount: Number,
      unconfirmedCount: Number,
      confirmedCount: Number,
      createTime: Number,
      devFee: Number,
    },
    { timestamps: true }
  );

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Order = mongoose.model("order", schema);
  return Order;
};
