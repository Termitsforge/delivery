import { Document, Types } from 'mongoose';

// Интерфейс для продукта
export interface IProduct extends Document {
  id: string;
  name: string;
  price: number;
}

// Интерфейс для клиента
export interface ICustomer extends Document {
  name: string;
  email: string;
  address: string;
}

// Интерфейс для строки заказа
export interface IOrderProduct {
  product: Types.ObjectId | IProduct; // Объект, который будет подгружен через populate
  count: number;
}

// Интерфейс для заказа
export interface IOrder extends Document {
  products: IOrderProduct[];
  customer: Types.ObjectId | ICustomer; // Объект, который будет подгружен через populate
  totalAmount: number;
  status: string;
  createdAt: Date;
}
