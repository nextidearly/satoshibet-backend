const fs = require("fs");
const path = require("path");
const constant = require("../constant/index.js");

const db = require("../models");
const Order = db.orders;
const Holder = db.holders;

// File path to store mintQueue data
const mintQueueFilePath = path.join(__dirname, "../constant/mintQueue.json");

// Load mintQueue from the file system on server startup
let mintQueue = [];

// Function to save mintQueue data to the file system
const saveMintQueueToFile = () => {
  fs.writeFileSync(mintQueueFilePath, JSON.stringify(mintQueue));
};

// Function to load mintQueue data from the file system
const loadMintQueueFromFile = () => {
  try {
    mintQueue = JSON.parse(fs.readFileSync(mintQueueFilePath));
  } catch (error) {
    console.error("Error loading mintQueue from file:", error);
    mintQueue = [];
  }
};

// Function to read file and return data URL
const readFileToDataURL = async (filePath) => {
  try {
    // Read the file asynchronously
    const fileData = await fs.promises.readFile(filePath);

    // Convert file data to a data URL
    const dataURL = `data:image/png;base64,${fileData.toString("base64")}`;

    return dataURL;
  } catch (error) {
    console.error("Error reading file:", error);
    throw new Error("Failed to read file");
  }
};

// Function to fetch the recommended fee rate
const getRecommendedFeeRate = async () => {
  try {
    const response = await fetch(
      "https://mempool.space/api/v1/fees/recommended"
    );
    const feeData = await response.json();
    return feeData.hourFee;
  } catch (error) {
    console.error("Error fetching recommended fee rate:", error);
    throw new Error("Failed to fetch recommended fee rate");
  }
};

// Function to process pending mint requests
const processMintQueue = async () => {
  try {
    // If queue is empty or already processing, return
    if (mintQueue.length === 0) {
      console.log("--------------Finished--------------");
      return;
    }

    // If queue is empty or already processing, return
    if (processMintQueue.isProcessing) {
      console.log("--------------processing--------------");
      return;
    }

    // Mark processing flag as true
    processMintQueue.isProcessing = true;

    // Dequeue next mint request
    const { orderId } = mintQueue.shift();

    // Function to periodically check mint order status
    const checkStatus = async () => {
      console.log(
        "==============================================================================="
      );
      console.log("mintQueue length: ", mintQueue.length);
      try {
        // Check mint order status using transaction ID
        const response = await fetch(
          `https://open-api.unisat.io/v2/inscribe/order/${orderId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.UNISAT_OPENAPK_KEY}`,
              accept: "application/json",
            },
          }
        );

        const orderStatus = await response.json();

        console.log("orderId: ", orderId);

        if (orderStatus.code === 0 && !orderStatus.data) {
          console.log("invalid orderId");
          processMintQueue.isProcessing = false; // Mark processing as false
          processMintQueue(); // Process next request in queue
          saveMintQueueToFile(); // Save updated mintQueue to file
          return;
        }

        if (orderStatus.code === -1) {
          console.log(orderStatus.msg);
          processMintQueue.isProcessing = false; // Mark processing as false
          processMintQueue(); // Process next request in queue
          saveMintQueueToFile(); // Save updated mintQueue to file
          return;
        }

        console.log("status: ", orderStatus.data?.status);

        // If status is confirmed, log NFT ID and stop checking
        if (orderStatus.data?.status === "pending") {
          // If status is pending, log and continue checking
          console.log("Still pending, Checking again in 10 seconds.");
          setTimeout(checkStatus, 10000);
        }

        if (orderStatus.data.status === "closed") {
          console.log("closed");

          const updatedOrder = await Order.findOneAndUpdate(
            { orderId: orderId },
            {
              $set: orderStatus.data,
            },
            {
              new: true,
            }
          );

          if (updatedOrder) {
            console.log("updated successfully");
          } else {
            console.log("not updated");
          }
          processMintQueue.isProcessing = false; // Mark processing as false
          processMintQueue(); // Process next request in queue
          saveMintQueueToFile(); // Save updated mintQueue to file
          return;
        }

        if (
          orderStatus.data.status === "inscribing" ||
          orderStatus.data.status === "minted"
        ) {
          console.log("minted: ", orderStatus.data.files[0].inscriptionId);

          const exist = Holder.exists({
            inscriptionId: orderStatus.data.files[0].inscriptionId,
          });

          if (!exist) {
            const holder = new Holder({
              address: orderStatus.data.receiveAddress,
              inscriptionId: orderStatus.data.files[0].inscriptionId,
            });
            const newHolder = await holder.save();
            console.log("saved: ", newHolder._id);
          }

          const updatedOrder = await Order.findOneAndUpdate(
            { orderId: orderId },
            {
              $set: orderStatus.data,
            },
            {
              new: true,
            }
          );

          if (updatedOrder) {
            console.log("updated successfully");
          } else {
            console.log("not updated");
          }

          processMintQueue.isProcessing = false; // Mark processing as false
          processMintQueue(); // Process next request in queue
          saveMintQueueToFile(); // Save updated mintQueue to file
          return;
        }
      } catch (error) {
        console.log("Api is crashed 2, Checking again in 10 seconds.", error);
        setTimeout(checkStatus, 10000);
        saveMintQueueToFile(); // Save updated mintQueue to file
      }
    };

    // Start checking mint order status
    checkStatus();
  } catch (error) {
    console.error("Error minting NFT:", error);
    processMintQueue.isProcessing = false; // Mark processing as false
    saveMintQueueToFile(); // Save updated mintQueue to file
  }
};

// Retrieve ordinal number to mint
const getNextOrdinalNumber = async (req, res) => {
  try {
    let lastOrdinal;
    // Find the last ordinal and get its ordinalName
    lastOrdinal = await Order.findOne({
      status: { $in: ["closed"] },
    })
      .sort({ ordinalName: 1 })
      .select("ordinalName");

    if (lastOrdinal) {
      return lastOrdinal.ordinalName;
    } else {
      // Find the last ordinal and get its ordinalName
      lastOrdinal = await Order.findOne()
        .sort({ ordinalName: -1 })
        .select("ordinalName");
    }

    // If no existing orders found, return 1 as the next ordinal number
    if (!lastOrdinal) {
      return 1;
    }

    if (lastOrdinal.ordinalName === constant.supply) {
      // Send the next ordinal number as response
      return 0;
    }

    // Calculate the next ordinal number
    const nextOrdinalNumber = lastOrdinal.ordinalName + 1;

    // Send the next ordinal number as response
    return nextOrdinalNumber;
  } catch (error) {
    console.error("Error retrieving next ordinal number:", error);
  }
};

exports.checkIsWhitelisted = async (req, res) => {
  try {
    // Validate request
    if (!req.body.address) {
      return res.status(400).send({ message: "address can not be empty" });
    }

    //check if it's exists
    const exist = await Holder.exists({ address: req.body.address });

    // Send the boolean flag as response
    res.json({
      code: 0,
      msg: "OK",
      data: {
        whitlelisted: exist ? true : false,
      },
    });
  } catch (error) {
    console.error("Error retrieving next ordinal number:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Retrieve an order by orderId
exports.getOrderById = async (req, res) => {
  try {
    // Validate request
    if (!req.params.id) {
      return res.status(400).send({ message: "Id can not be empty" });
    }

    const id = req.params.id;

    // Find the order
    const order = await Order.findOne({ orderId: id });

    // Send the found order as response
    res.json({ code: 0, msg: "OK", data: order });
  } catch (error) {
    console.error("Error retrieving next ordinal number:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Retrieve order list by receive address
exports.getOrderListByAddress = async (req, res) => {
  try {
    // Validate request
    if (!req.params.address) {
      return res.status(400).send({ message: "address can not be empty" });
    }

    const address = req.params.address;

    // Find the order list by address
    const list = await Order.find({ receiveAddress: address });

    // Send the found order list as response
    res.json({ code: 0, msg: "OK", data: list });
  } catch (error) {
    console.error("Error retrieving next ordinal number:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create a new Order
exports.createOrder = async (req, res) => {
  try {
    // Validate request
    if (!req.body.receiveAddress) {
      return res.status(400).send({ message: "receiveAddress is required" });
    }

    const ordinalName = await getNextOrdinalNumber();

    if (ordinalName === 0) {
      return res.status(400).send({ message: "Ordinals are over minted" });
    }

    const fileName = ordinalName + ".png"; // File Name
    const filePath = path.join(__dirname, "..", "../ordinals", fileName); // Construct file path

    const dataURL = await readFileToDataURL(filePath);

    // Fetch recommended fee rate
    const feeRate = await getRecommendedFeeRate();

    // Prepare data for the order
    const data = {
      receiveAddress: req.body.receiveAddress,
      outputValue: 546,
      files: [{ dataURL: dataURL, filename: fileName }],
      feeRate: feeRate,
    };

    // Make API call to create the order
    const response = await fetch(
      "https://open-api.unisat.io/v2/inscribe/order/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.UNISAT_OPENAPK_KEY}`,
          accept: "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    // Handle response from the API
    const orderJson = await response.json();

    if (orderJson.code === -1) {
      return res.status(400).send({ message: orderJson.msg });
    }

    const existingOrder = await Order.findOne({ ordinalName: ordinalName });

    if (existingOrder) {
      await Order.findOneAndUpdate(
        { ordinalName: ordinalName },
        {
          $set: orderJson.data,
        },
        {
          new: true,
        }
      );
    } else {
      // Save order to DB
      const order = new Order({
        ...orderJson.data,
        ordinalName: ordinalName,
      });
      await order.save();
    }

    return res.status(200).send({ order: orderJson, ordinalName: ordinalName });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

// Mint ordinal
exports.mintAndQueue = async (req, res) => {
  try {
    // Validate request
    if (!req.body.orderId) {
      return res.status(400).send({ message: "orderId cannot be empty" });
    }

    // Add request to mint queue
    mintQueue.push({ orderId: req.body.orderId });

    saveMintQueueToFile(); // Save updated mintQueue to file

    // Process mint queue if not already processing
    processMintQueue();

    return res.status(200).send({
      code: 0,
      msg: "OK",
      data: { message: "Checking order to get & save inscription Id" },
    });
  } catch (error) {
    console.error("Error minting and queuing:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

// Load mintQueue data from the file system on server startup
loadMintQueueFromFile();
