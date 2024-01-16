import express, { Request, Response, NextFunction } from "express";
import {
  CreateOrder,
  CustomerLogin,
  CustomerSignUp,
  CustomerVerify,
  DeleteCart,
  EditCustomerProfile,
  GetCart,
  GetCustomerProfile,
  GetOrders,
  GetOrdersById,
  RequestOtp,
  AddToCart,
} from "../controllers";
import { authenticate } from "../middlewares";

const router = express.Router();

/*-----------------------Sign Up / Create user--------------------------*/
router.post("/signup", CustomerSignUp);
/*-----------------------Login--------------------------*/
router.post("/login", CustomerLogin);

//authentication

router.use(authenticate);

/*-----------------------Verify Customer Account--------------------------*/
router.patch("/verify", CustomerVerify);

/*-----------------------OTP / Requesting OTP--------------------------*/
router.get("/otp", RequestOtp);

/*-----------------------Profile--------------------------*/
router.get("/profile", GetCustomerProfile);
router.patch("/profile", EditCustomerProfile);

//order
router.post("/create-order", CreateOrder);
router.get("/orders", GetOrders);
router.get("/order/:id", GetOrdersById);

//cart

router.post("/cart", AddToCart);
router.get("/cart", GetCart);
router.delete("/cart", DeleteCart);

//payment

export { router as CustomerRoute };
