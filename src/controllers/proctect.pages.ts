import type { Request, Response } from "express";
import prisma from "../db/prisma.js";
import bcrypt from "bcrypt";

export const pageRequest = async (req: Request, res: Response) => {
 //// ffetch pages here
};

//add more apis here, for instance, fetchstudent, delete student, etc