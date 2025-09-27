import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    categoryName: { type: String, trim: true }, // optional alias support
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
