import mongoose, { Document, Schema } from "mongoose";

export interface OrderDoc extends Document {
  orderID: string;
  vandorId: string;
  items: [any];
  totalAmount: number;
  orderDate: Date;
  paidThrough: string;
  paymentResponse: string;
  orderStatus: string;
  remarks: string;
  deliveryId: string;
  appliedOffers: boolean;
  offerId: string;
  readyTime: number; // maximum 60 mins
}

const OrderSchema = new Schema(
  {
    orderID: { type: String, required: true },
    vandorId: {
      type: String,
      required: true,
    },
    items: {
      type: [
        {
          food: { type: Schema.Types.ObjectId, ref: "food", required: true },
          unit: { type: Number, required: true },
        },
      ],
      required: true,
    },
    totalAmount: { type: Number, required: true },
    orderDate: { type: Date },
    paidThrough: { type: String },
    paymentResponse: { type: String },
    orderStatus: { type: String },
    remarks: { type: String },
    deliveryId: { type: String },
    appliedOffers: { type: Boolean },
    offerId: { type: String },
    readyTime: { type: Number },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.__v, delete ret.createdAt, delete ret.updatedAt;
      },
    },
    timestamps: true,
  }
);

const Order = mongoose.model<OrderDoc>("order", OrderSchema);

export { Order };
