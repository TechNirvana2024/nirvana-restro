import React from "react";

// Define the Table type based on the Sequelize schema
interface Table {
  id: number;
  floorId: number;
  tableNo: string;
  name: string | null;
  type: "indoor" | "outdoor" | "vip" | "regular";
  capacity: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  currentSessionId: string | null;
  sessionStartTime: string | null;
  isActive: boolean;
}

interface RestroTableProps {
  table: Table;
}

const RestroTable: React.FC<RestroTableProps> = ({ table }) => {
  return (
    <div
      className={`p-4 bg-white rounded-lg shadow-md border-l-4 
        ${
          table.status === "available"
            ? "border-green-500 hover:cursor-pointer"
            : table.status === "occupied"
              ? "border-red-500"
              : table.status === "reserved"
                ? "border-yellow-500"
                : "border-gray-500"
        } 
        hover:shadow-lg transition-shadow duration-200`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-900">
          Table {table.tableNo}
        </h3>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full 
            ${
              table.status === "available"
                ? "bg-green-100 text-green-800"
                : table.status === "occupied"
                  ? "bg-red-100 text-red-800"
                  : table.status === "reserved"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
            }`}
        >
          {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
        </span>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <p>
          <span className="font-medium">Floor:</span> {table.floorId}
        </p>
        <p>
          <span className="font-medium">Type:</span>{" "}
          {table.type.charAt(0).toUpperCase() + table.type.slice(1)}
        </p>
        <p>
          <span className="font-medium">Capacity:</span> {table.capacity} seats
        </p>
        <p>
          <span className="font-medium">Session Start:</span>{" "}
          {table.sessionStartTime
            ? new Date(table.sessionStartTime).toLocaleTimeString()
            : "-"}
        </p>
        <p>
          <span className="font-medium">Active:</span>{" "}
          {table.isActive ? "Yes" : "No"}
        </p>
      </div>
    </div>
  );
};

export default RestroTable;
