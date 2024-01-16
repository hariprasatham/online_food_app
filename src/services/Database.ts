import mongoose, { ConnectOptions } from "mongoose";

import { MONGO_URI } from "../config";

export default async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("DB connected");
  } catch (ex) {
    console.log(ex);
  }
};
