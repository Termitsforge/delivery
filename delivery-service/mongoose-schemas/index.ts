import mongoose, { Schema, Document } from "mongoose";
import { IProduct, ICustomer, IOrder } from "../types";

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: true },
});

const OrderSchema = new Schema<IOrder>({
  products: [
    {
      product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      count: { type: Number, required: true },
    },
  ],
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Модели
export const Product = mongoose.model<IProduct>("Product", ProductSchema);
export const Customer = mongoose.model<ICustomer>("Customer", CustomerSchema);
export const Order = mongoose.model<IOrder>("Order", OrderSchema);
