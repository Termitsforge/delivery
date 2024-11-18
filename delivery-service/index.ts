import express, { Request, Response } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";

import { IProduct, ICustomer } from "./types";
import { errorHandler } from "./middlewares";
import { Product, Customer, Order } from "./mongoose-schemas";

const PORT = 3000;
const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:3001" }));

process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);

// Подключение к базе данных MongoDB
mongoose
  .connect("mongodb://localhost:27017/grocery-delivery")
  .catch((error) => console.error("MongoDB connection error:", error));

// 1. Получение списка продуктов
app.get("/products", async (req: Request, res: Response): Promise<void> => {
  const products = await Product.find().catch((error) => {
    console.error("Ошибка получения списка продуктов:", error);
    throw error;
  });

  if (!products) {
    res.json([]);
    return;
  }

  res.json(products);
});

// 2. Добавление нового продукта
app.post("/products", async (req: Request, res: Response): Promise<void> => {
  const productList: { name: string; price: number }[] = req.body;

  if (!Array.isArray(productList)) {
    res.status(400).json({ message: "Неверный формат данных" });
    return;
  }

  productList.forEach(async ({ name, price }) => {
    const product = new Product({ name, price });
    await product.save().catch((error) => {
      console.error("Ошибка сохранения продукта:", error);
      throw error;
    });
  });

  res.status(201).json({ message: "Продукты добавлены" });
});

// 3. Создание нового заказа
app.post("/orders", async (req: Request, res: Response): Promise<void> => {
  const { products, customerName, customerEmail, customerAddress } = req.body;

  let customer = await Customer.findOne({ email: customerEmail }).catch(
    (error) => {
      console.error("Ошибка поиска клиента:", error);
      throw error;
    }
  );

  if (!customer) {
    customer = new Customer({
      name: customerName,
      email: customerEmail,
      address: customerAddress,
    });

    await customer.save().catch((error) => {
      console.error("Ошибка сохранения клиента:", error);
      throw error;
    });
  }
  // Рассчитываем общую сумму заказа
  let totalAmount = 0;
  const productDetails = await Promise.all(
    products.map(async (item: { productId: string; count: number }) => {
      const product = await Product.findById(item.productId).catch((error) => {
        console.error("Ошибка поиска продукта:", error);
        throw error;
      });

      if (!product) throw new Error("Продукт не найден");

      totalAmount += product.price * item.count;

      return { product: product._id, count: item.count };
    })
  );

  const order = new Order({
    products: productDetails,
    totalAmount,
    customer: customer._id,
    status: "В обработке",
  });

  await order.save().catch((error) => {
    console.error("Ошибка создания заказа:", error);
    throw error;
  });

  const savedOrder = await (
    await order.populate<{ products: { product: IProduct; count: number }[] }>(
      "products.product"
    )
  ).populate<{ customer: ICustomer }>("customer");

  res.status(201).json({ message: "Заказ создан", order: savedOrder });

  // Обновление статуса заказа
  setTimeout(async () => {
    order.status = "В доставке";
    await order.save().catch((error) => {
      console.error("Ошибка обновления статуса на 'В доставке':", error);
    });

    setTimeout(async () => {
      order.status = "Доставлено";
      await order.save().catch((error) => {
        console.error("Ошибка обновления статуса на 'Доставлено':", error);
      });
    }, 30000);
  }, 30000);
});

// 4. Получение информации о заказе
app.get("/orders/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate<{ products: { product: IProduct; count: number }[] }>(
      "products.product"
    )
    .populate<{ customer: ICustomer }>("customer")
    .catch((error) => {
      console.error("Ошибка поиска заказа:", error);
      throw error;
    });

  if (!order) {
    res.status(404).json({ message: "Заказ не найден" });
    return;
  }

  res.status(200).json({
    id: order._id,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      address: order.customer.address,
    },
    products: order.products.map((item) => ({
      name: item.product.name,
      price: item.product.price,
      count: item.count,
      totalAmount: item.product.price * item.count,
    })),
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
  });
});

// 5. Получение списка клиентов
app.get("/customers", async (req: Request, res: Response): Promise<void> => {
  const customers = await Customer.find().catch((error) => {
    console.error("Ошибка получения списка клиентов:", error);
    throw error;
  });

  if (customers) res.json(customers);
});

app.get("/orders", async (req: Request, res: Response): Promise<void> => {
  const orders = await Order.find()
    .populate<{ products: { product: IProduct; count: number }[] }>(
      "products.product"
    )
    .populate<{ customer: ICustomer }>("customer")
    .catch((error) => {
      console.error("Ошибка получения списка заказов:", error);
      throw error;
    });

  if (!orders) {
    res.json([]);
    return;
  }

  res.json(orders);
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
