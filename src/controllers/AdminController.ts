import express, { Request, Response, NextFunction } from "express";
import { CreateVandorInput } from "../dto";
import { Vandor } from "../models";
import { GeneratePassword, GenerateSalt } from "../utility";

export const FindVandor = (id: string | undefined, email?: string) => {
  if (email) {
    return Vandor.findOne({ email: email });
  } else {
    return Vandor.findById(id);
  }
};

export const CreateVandor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    ownerName,
    foodType,
    pincode,
    address,
    phone,
    email,
    password,
  } = <CreateVandorInput>req.body;

  const existingVandor = await FindVandor("", email);

  if (existingVandor !== null) {
    return res.json({ message: "a Vandor already exists with this email Id" });
  }

  //generate a salt string
  const salt = await GenerateSalt();
  //encrypt the password using the salt
  const userPassword = await GeneratePassword(password, salt);

  const createVandor = await Vandor.create({
    name: name,
    address: address,
    pincode: pincode,
    foodType: foodType,
    email: email,
    password: userPassword,
    salt: salt,
    ownerName: ownerName,
    phone: phone,
    rating: 0,
    serviceAvailable: false,
    coverImages: [],
    foods: [],
  });

  return res.json(createVandor);
};

export const GetVandors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const vandors = await Vandor.find();
  if (vandors !== null) {
    return res.json(vandors);
  }

  return res.json({ message: "Vandors data not available" });
};

export const GetVandorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const vandorId = req.params.id;
  const vandor = await FindVandor(vandorId);

  if (Vandor !== null) {
    return res.json(vandor);
  }
  return res.json({ message: "Vandor data not available" });
};
