import express, { Request, Response, NextFunction } from "express";
import { FoodDoc, Vandor } from "../models";

export const GetFoodAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pincode = req.params.pincode;

  const result = await Vandor.find({
    pincode: pincode,
    serviceAvailable: false,
  })
    .sort([["rating", "descending"]])
    .populate("foods");

  if (result.length > 0) {
    return res.status(200).json(result);
  }

  return res.status(400).json({ message: "Data Not found" });
};

export const GetTopRestaurants = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pincode = req.params.pincode;

  const result = await Vandor.find({
    pincode: pincode,
    serviceAvailable: false,
  })
    .sort([["rating", "descending"]])
    .limit(10);

  if (result.length > 0) {
    return res.status(200).json(result);
  }

  return res.status(400).json({ message: "Data Not found" });
};

export const GetFoodsIn30Min = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pincode = req.params.pincode;

  const result = await Vandor.find({
    pincode: pincode,
    serviceAvailable: false,
    // readyTime:
  }).populate("foods");

  if (result.length > 0) {
    let foodResults: any = [];

    result.map((vandor) => {
      const foods = vandor.foods as [FoodDoc];

      foodResults.push(...foods.filter((food) => food.readyTime <= 30));
    });

    return res.status(200).json(foodResults);
  }

  return res.status(400).json({ message: "Data Not found" });
};

export const SearchFoods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pincode = req.params.pincode;

  const result = await Vandor.find({
    pincode: pincode,
    serviceAvailable: false,
    // readyTime:
  }).populate("foods");

  if (result.length > 0) {
    let foodResults: any = [];

    result.map((vandor) => foodResults.push(...vandor.foods));

    return res.status(200).json(foodResults);
  }

  return res.status(400).json({ message: "Data Not found" });
};

export const RestaurantById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const restaurantId = req.params.id;

  const result = await Vandor.findById(restaurantId).populate("foods");

  if (result) {
    return res.status(200).json(result);
  }

  return res.status(400).json({ message: "Data Not found" });
};
