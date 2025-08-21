import Input from "@/components/Input";
import { OrderSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Button";
import { z } from "zod";
import { ORDER_LIST_ROUTE } from "@/routes/routeNames";
import { useEffect, useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import TextArea from "@/components/TextArea";
import Select from "@/components/Select";
import Model from "@/components/Model";
import { FaPlus, FaTrash, FaSearch } from "react-icons/fa";
import { MdShoppingCart } from "react-icons/md";

import { dummyTables } from "../../tempDatas/table";
import { dummyProducts } from "../../tempDatas/product";

type OrderFormType = z.infer<typeof OrderSchema>;

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  specialInstructions?: string;
  subtotal: number;
}

interface Props {
  isComponent?: boolean;
  closeModal?: () => void;
}

export default function AddEditOrder({
  isComponent = false,
  closeModal = () => {},
}: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormType>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      orderType: "dineIn",
      orderItems: [],
    },
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  const watchedOrderType = watch("orderType");

  useEffect(() => {
    const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    setTotalAmount(total);
    setValue("orderItems", orderItems);
  }, [orderItems, setValue]);

  const tableData = useMemo(
    () => ({
      data: {
        data: dummyTables.filter((table) => table.status === "available"),
      },
    }),
    [],
  );

  const productData = useMemo(
    () => ({
      data: {
        data: dummyProducts.filter(
          (product) =>
            product.isActive &&
            (productSearchTerm === "" ||
              product.name
                .toLowerCase()
                .includes(productSearchTerm.toLowerCase()) ||
              product.description
                .toLowerCase()
                .includes(productSearchTerm.toLowerCase())),
        ),
      },
    }),
    [productSearchTerm],
  );

  const tableOptions = useMemo(() => {
    if (!tableData?.data?.data) return [];
    return tableData.data.data.map(
      (table: { id: string; tableNumber: string }) => ({
        value: table.id,
        label: `Table ${table.tableNumber}`,
      }),
    );
  }, [tableData]);

  const addProductToOrder = (product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }) => {
    const existingItem = orderItems.find(
      (item) => item.productId === product.id,
    );

    if (existingItem) {
      updateOrderItemQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: `item_${Date.now()}_${Math.random()}`,
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: 1,
        subtotal: product.price,
        specialInstructions: "",
      };

      setOrderItems((prev) => [...prev, newItem]);
    }

    setIsProductModalOpen(false);
  };

  const updateOrderItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeOrderItem(itemId);
      return;
    }

    setOrderItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: item.productPrice * newQuantity,
            }
          : item,
      ),
    );
  };

  const removeOrderItem = (itemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSuccess = () => {
    if (isComponent) {
      closeModal();
    } else {
      navigate(ORDER_LIST_ROUTE);
    }
  };

  const onSubmit = async (data: OrderFormType) => {
    if (orderItems.length === 0) {
      setError("orderItems", {
        message: "At least one order item is required",
      });
      return;
    }
  };

  return (
    <>
      {!isComponent && (
        <PageTitle
          title={isEditMode ? "Edit Order" : "Create New Order"}
          isBack
        />
      )}

      <div className="max-w-6xl mx-auto">
        <form
          className={`space-y-8 ${isComponent ? "" : "form-container"}`}
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Order Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <MdShoppingCart className="mr-2 text-blue-600" />
              Order Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Controller
                name="orderType"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Order Type"
                    options={[
                      { value: "dineIn", label: "Dine In" },
                      { value: "takeaway", label: "Takeaway" },
                      { value: "delivery", label: "Delivery" },
                    ]}
                    className="w-full"
                    error={errors.orderType?.message}
                    required
                  />
                )}
              />

              {watchedOrderType === "dineIn" && (
                <Controller
                  name="tableId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Table"
                      options={tableOptions}
                      className="w-full"
                      error={errors.tableId?.message}
                      required
                    />
                  )}
                />
              )}

              <Input
                label="Customer Name"
                placeholder="Enter customer name"
                className="w-full"
                {...register("customerName")}
                error={errors.customerName?.message}
              />

              <Input
                label="Customer Phone"
                placeholder="Enter customer phone"
                className="w-full"
                {...register("customerPhone")}
                error={errors.customerPhone?.message}
              />

              <Input
                label="Customer Email"
                type="email"
                placeholder="Enter customer email"
                className="w-full"
                {...register("customerEmail")}
                error={errors.customerEmail?.message}
              />

              <Input
                label="Estimated Time (minutes)"
                type="number"
                placeholder="Enter estimated time"
                className="w-full"
                {...register("estimatedTime", { valueAsNumber: true })}
                error={errors.estimatedTime?.message}
              />
            </div>

            {watchedOrderType === "delivery" && (
              <div className="mt-6">
                <TextArea
                  label="Delivery Address"
                  placeholder="Enter complete delivery address"
                  className="w-full"
                  {...register("deliveryAddress")}
                  error={errors.deliveryAddress?.message}
                />
              </div>
            )}

            <div className="mt-6">
              <TextArea
                label="Order Note"
                placeholder="Any special instructions or notes"
                className="w-full"
                {...register("orderNote")}
                error={errors.orderNote?.message}
              />
            </div>
          </div>

          {/* Order Items Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Order Items
              </h3>
              <Button
                handleClick={() => {
                  setIsProductModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <FaPlus className="mr-2" />
                Add Items
              </Button>
            </div>

            {orderItems.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <MdShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No items added yet</p>
                <p className="text-gray-400 text-sm">
                  Click "Add Items" to start building the order
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.productName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        NPR {item.productPrice.toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          handleClick={() =>
                            updateOrderItemQuantity(item.id, item.quantity - 1)
                          }
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                        >
                          -
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          handleClick={() =>
                            updateOrderItemQuantity(item.id, item.quantity + 1)
                          }
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                        >
                          +
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          NPR {item.subtotal.toFixed(2)}
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={() => removeOrderItem(item.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-600 w-8 h-8 rounded-full flex items-center justify-center"
                      >
                        <FaTrash size={12} />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Total Section */}
                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-600">
                      NPR {totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {errors.orderItems && (
              <p className="text-red-500 text-sm mt-2">
                {errors.orderItems.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              handleClick={() => navigate(-1)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || orderItems.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-md flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <MdShoppingCart className="mr-2" />
                  {isEditMode ? "Update Order" : "Create Order"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Product Selection Modal */}
      <Model
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Select Products"
      >
        <div className="p-6">
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {productData?.data?.data?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {productData.data.data.map(
                (product: {
                  id: string;
                  name: string;
                  description: string;
                  price: number;
                  quantity: number;
                }) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-200 bg-white"
                    onClick={() => addProductToOrder(product)}
                  >
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">
                        NPR {product.price?.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Stock: {product.quantity}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium py-2 px-3 rounded transition-colors">
                        Add to Order
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <MdShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                {productSearchTerm
                  ? "No products found"
                  : "Loading products..."}
              </p>
              {productSearchTerm && (
                <p className="text-gray-400 text-sm">
                  Try searching with different keywords
                </p>
              )}
            </div>
          )}
        </div>
      </Model>
    </>
  );
}
