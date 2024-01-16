import express, { Request, Response, NextFunction } from "express";
import {
  GetFoodAvailability,
  GetFoodsIn30Min,
  GetTopRestaurants,
  RestaurantById,
  SearchFoods,
} from "../controllers";

const router = express.Router();

/*-----------------------Food Availability--------------------------*/
router.get("/:pincode", GetFoodAvailability);

/*-----------------------Top Restaurants--------------------------*/
router.get("/top-restaurants/:pincode", GetTopRestaurants);

/*-----------------------Foods Available in 30 Mins--------------------------*/
router.get("/foods-in-30-mins/:pincode", GetFoodsIn30Min);

/*-----------------------Search Foods--------------------------*/
router.get("/search/:pincode", SearchFoods);

/*-----------------------Find Restaurants By Id--------------------------*/
router.get("/restaurant/:id", RestaurantById);

export { router as ShoppingRoute };
