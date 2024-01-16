import mongoose, { Document, Schema } from "mongoose";
import { transform } from "typescript";

export interface OfferDoc extends Document {
  offerType: string; //VENDOR //GENERIC
  vandors: [any];
  title: string;
  description: string;
  minValue: number;
  offerAmount: number;
  startValidity: Date;
  endValidity: Date;
  promocode: string;
  promoType: string;
  banks: [any];
  bins: [any];
  pincode: string;
  isActive: boolean;
}

const OfferSchema = new Schema(
  {
    offerType: { type: String, required: true },
    vandors: [
      {
        type: Schema.Types.ObjectId,
        ref: "vandor",
      },
    ],
    title: { type: String, required: true },
    description: { type: String },
    minValue: { type: Number, required: true },
    offerAmount: { type: Number, required: true },
    startValidity: { type: Date, },
    endValidity: { type: Date, },
    promocode: { type: String, required: true },
    promoType: { type: String, required: true },
    banks: [
      {
        type: String,
      },
    ],
    bins: [
      {
        type: Number,
      },
    ],
    pincode: { type: String, required: true },
    isActive: { type: Boolean, },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
      },
    },
    timestamps: true,
  }
);

const Offer = mongoose.model<OfferDoc>("offer", OfferSchema);

export { Offer };
