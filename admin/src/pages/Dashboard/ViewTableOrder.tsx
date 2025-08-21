import React from "react";
import { CONTACT_URL, ORDER_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { RiSeoLine } from "react-icons/ri";
import { dummyTables } from "../../tempDatas/table";
import { dummyOrders } from "../../tempDatas/order";
import { Link } from "react-router-dom";

interface ViewTableOrderProps {
  id: number | null;
  onCheckout: (tableId: number) => void;
}

const ViewTableOrder: React.FC<ViewTableOrderProps> = ({ id, onCheckout }) => {
  const {
    data: contactData,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery(
    { url: `${CONTACT_URL}${id}` },
    {
      skip: id === null || id === undefined,
    },
  );

  const table = dummyTables.find((table) => table.id === id);
  const orders = dummyOrders.filter((order) => order.tableId === String(id));

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mt-[4rem] mb-[1.5rem]">
        <h2 className="text-xl font-semibold text-gray-800">
          Table {table?.tableNo || id}
        </h2>
        <Link
          to={`/admin/${ORDER_URL}${id}`}
          className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-primaryColor text-white"
        >
          <RiSeoLine />
          <span className="font-[500] text-[15px]">Add Order</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="flex flex-col gap-[1.5rem] mb-[2.5rem]">
          {orders.length === 0 ? (
            <div className="text-gray-600 text-center">
              No orders for this table
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Order #{order.orderNumber}
                </h3>
                <div className="space-y-2">
                  {order.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start border-b border-gray-200 py-2"
                    >
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">{item.productName}</p>
                        <p>Qty: {item.quantity}</p>
                        {item.specialInstructions && (
                          <p className="text-xs italic">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 text-right">
                        <p>${item.productPrice.toFixed(2)} each</p>
                        <p>Subtotal: ${item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-lg font-semibold text-gray-800">
                    Total: ${order.totalAmount.toFixed(2)}
                  </p>
                  <button
                    onClick={() => onCheckout(id!)}
                    className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-green-600 text-white hover:bg-green-700"
                  >
                    <span className="font-[500] text-[15px]">Checkout</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ViewTableOrder;
