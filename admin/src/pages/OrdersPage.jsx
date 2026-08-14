import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/api/admin/orders').then(({ data }) => setOrders(data.orders)).catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Protected Orders</h1>
      <table className="table">
        <thead>
          <tr><th>Order</th><th>Artist</th><th>Buyer</th><th>Amount</th><th>Status</th><th>Payment</th><th>Created</th><th></th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.title}</td>
              <td>{o.artist.user.name}</td>
              <td>{o.buyer.name}</td>
              <td>${Number(o.amount).toFixed(2)}</td>
              <td><span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
              <td>{o.paymentStatus}</td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td><Link to={`/orders/${o.id}`}>Review</Link></td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan="8">No orders.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}