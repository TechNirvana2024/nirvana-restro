import { z } from "zod";

export const TableSchema = z.object({
  tableNo: z.string().min(1, "Table No is Required"),
  name: z.string().optional(),
  floorId: z.string().min(1, "Floor is Required"),
  type: z.enum(["indoor", "outdoor", "vip", "regular"], {
    required_error: "Table Type is Required",
  }),
  capacity: z.number().min(1, "Capacity must be at least 1"),
});
