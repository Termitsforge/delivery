import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

interface Product {
  _id: string;
  name: string;
  price: number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  count: number;
}

interface OrderProduct {
  product: { _id: string; name: string; price: number };
  count: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  address?: string;
}

interface Order {
  _id: string;
  products: OrderProduct[];
  customer: CustomerInfo;
  totalAmount: number;
  status: string;
}

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    email: "",
    city: "",
    street: "",
    house: "",
    apartment: "",
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Загружаем список продуктов
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await axios.get<Product[]>("http://localhost:3000/products");
      setProducts(res.data);
    };
    fetchProducts();
  }, []);

  // Загружаем список заказов
  const loadOrders = async () => {
    const res = await axios.get<Order[]>("http://localhost:3000/orders");
    const parsedOrders = res.data.map((order) => {
      const [city, street, house, apartment] =
        order.customer.address?.split(", ") ?? [];

      return Object.assign(order, {
        customer: { ...order.customer, city, street, house, apartment },
      });
    });
    setOrders(parsedOrders);
  };

  // Обновление статуса заказов каждые 15 секунд
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000); // Обновление каждые 15 секунд
    return () => clearInterval(interval);
  }, []);

  // Добавляем продукт в корзину
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find(
        (item) => item.productId === product._id
      );
      if (existingProduct) {
        return prevCart.map((item) =>
          item.productId === product._id
            ? { ...item, count: item.count + 1 }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            count: 1,
          },
        ];
      }
    });
  };

  // Убираем продукт из корзины
  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.productId !== productId)
    );
  };

  // Создание заказа
  const createOrder = async () => {
    const orderData = {
      products: cart.map((item) => ({
        productId: item.productId,
        count: item.count,
      })),
      customerName: customer.name,
      customerEmail: customer.email,
      customerAddress: `${customer.city}, ${customer.street}, ${customer.house}, ${customer.apartment}`,
    };

    try {
      await axios.post("http://localhost:3000/orders", orderData);
      setCart([]);
      setCustomer({
        name: "",
        email: "",
        city: "",
        street: "",
        house: "",
        apartment: "",
      });
      loadOrders();
    } catch (error) {
      console.error("Ошибка при создании заказа:", error);
    }
  };

  return (
    <div className="container-fluid mt-5">
      <h1 className="mb-4">Сервис доставки продуктов</h1>

      <div className="row">
        {/* Продукты с прокруткой и рамкой */}
        <div
          className="col-md-6"
          style={{
            maxHeight: "500px",
            overflowY: "scroll",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "15px",
          }}
        >
          <h2>Продукты</h2>
          <ul className="list-group">
            {products.map((product) => (
              <li
                key={product._id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>
                  {product.name} - {product.price} ₽
                </span>
                <button
                  className="btn btn-primary"
                  onClick={() => addToCart(product)}
                >
                  Добавить
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Корзина и данные клиента с рамкой */}
        <div className="col-md-6">
          <div
            style={{
              maxHeight: "250px",
              overflowY: "scroll",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
            }}
          >
            <h2>Корзина</h2>
            <ul className="list-group mb-3">
              {cart.map((item) => (
                <li
                  key={item.productId}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>
                    {item.name} x {item.count} - {item.price * item.count} ₽
                  </span>
                  <button
                    className="btn btn-danger"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    Убрать
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              marginTop: "15px",
            }}
          >
            <h3>Информация о клиенте</h3>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Имя"
              value={customer.name}
              onChange={(e) =>
                setCustomer({ ...customer, name: e.target.value })
              }
            />
            <input
              type="email"
              className="form-control mb-2"
              placeholder="Email"
              value={customer.email}
              onChange={(e) =>
                setCustomer({ ...customer, email: e.target.value })
              }
            />
            <div className="row">
              <div className="col-6">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Город"
                  value={customer.city}
                  onChange={(e) =>
                    setCustomer({ ...customer, city: e.target.value })
                  }
                />
              </div>
              <div className="col-6">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Улица"
                  value={customer.street}
                  onChange={(e) =>
                    setCustomer({ ...customer, street: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="row">
              <div className="col-4">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Дом"
                  value={customer.house}
                  onChange={(e) =>
                    setCustomer({ ...customer, house: e.target.value })
                  }
                />
              </div>
              <div className="col-4">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Квартира"
                  value={customer.apartment}
                  onChange={(e) =>
                    setCustomer({ ...customer, apartment: e.target.value })
                  }
                />
              </div>
              <div className="col-4">
                <button className="btn btn-success w-100" onClick={createOrder}>
                  Создать заказ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Список заказов с рамкой */}
      <div
        className="mt-5"
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "15px",
        }}
      >
        <h2>Список всех заказов</h2>
        <ul className="list-group">
          {orders.map((order) => (
            <li
              key={order._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>
                Заказ #{order._id} - Статус: {order.status}
              </span>
              <button
                className="btn btn-info"
                onClick={() => setSelectedOrder(order)}
              >
                Посмотреть детали
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Детали заказа */}
      {selectedOrder && (
        <div
          className="mt-3 p-3"
          style={{ border: "1px solid #ddd", borderRadius: "8px" }}
        >
          <h3>Детали заказа #{selectedOrder._id}</h3>
          <p>Имя: {selectedOrder.customer.name}</p>
          <p>Email: {selectedOrder.customer.email}</p>
          <p>
            Адрес: {selectedOrder.customer.city},{" "}
            {selectedOrder.customer.street}, {selectedOrder.customer.house},{" "}
            {selectedOrder.customer.apartment}
          </p>
          <p>Сумма: {selectedOrder.totalAmount} ₽</p>
          <h4>Продукты:</h4>
          <ul className="list-group">
            {selectedOrder.products.map((item, index) => (
              <li key={index} className="list-group-item">
                {item.product.name} x {item.count} -{" "}
                {item.product.price * item.count} ₽
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;
