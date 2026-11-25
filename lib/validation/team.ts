import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tên đội phải có ít nhất 2 ký tự")
    .max(60, "Tên đội tối đa 60 ký tự"),
  description: z.string().trim().max(600, "Mô tả tối đa 600 ký tự"),
});

export const messageSchema = z
  .string()
  .trim()
  .max(300, "Lời nhắn tối đa 300 ký tự");

export const uuidSchema = z.string().uuid("Mã không hợp lệ");
