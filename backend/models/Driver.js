import mongoose from "mongoose";
const { Schema } = mongoose;

const driverSchema = new Schema(
  { name: String, phone: String },
  { collection: "drivers" }           // collection = drivers (ok)
);

export default mongoose.models.Driver
  || mongoose.model("Driver", driverSchema); // MODEL NAME = "Driver"