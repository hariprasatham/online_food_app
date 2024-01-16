import { classToPlain, plainToClass } from "class-transformer";
import { ValidationError, validate } from "class-validator";
import express, { Request, Response, NextFunction } from "express";
import {
  CreateCustomerInputs,
  CustomerLoginInputs,
  EditCustomerProfileInputs,
  orderInputs,
} from "../dto";
import {
  GeneratePassword,
  GenerateSalt,
  GenerateOTP,
  onRequestOtp,
  GenerateSignature,
  validatePassword,
} from "../utility";
import { Customer, Food } from "../models";
import { Order } from "../models/Order";

export const CustomerSignUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customerInputs = plainToClass(CreateCustomerInputs, req.body);

  const inputErrors = await validate(customerInputs, {
    validationError: { target: true },
  });

  if (inputErrors.length > 0) {
    return res.status(400).json(inputErrors);
  }

  const { email, password, phone } = customerInputs;

  const salt = await GenerateSalt();
  const userPassword = await GeneratePassword(password, salt);

  const { otp, expiry } = GenerateOTP();

  const existingCustomer = await Customer.findOne({ email: email });

  if (existingCustomer !== null) {
    return res
      .status(400)
      .json({ message: "Customer already exists with the same email" });
  }

  const result = await Customer.create({
    email: email,
    password: userPassword,
    salt: salt,
    phone: phone,
    otp: otp,
    otp_expiry: expiry,
    firstName: "",
    lastName: "",
    address: "",
    verified: false,
    lat: 0,
    lng: 0,
    orders: [],
  });

  if (result) {
    await onRequestOtp(otp, phone);

    const signature = await GenerateSignature({
      _id: result._id,
      email: result.email,
      verified: result.verified,
    });

    return res.status(201).json({
      signature: signature,
      verified: result.verified,
      email: result.email,
    });
  }
  return res.status(400).json({ message: "Error with signUp" });
};

export const CustomerLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customerInputs = plainToClass(CustomerLoginInputs, req.body);

  const loginErrors = await validate(customerInputs, {
    validationError: { target: true },
  });

  if (loginErrors.length > 0) {
    return res.status(400).json(loginErrors);
  }

  const { email, password } = customerInputs;

  const customer = await Customer.findOne({ email: email });
  if (customer !== null) {
    const validation = await validatePassword(
      password,
      customer.password,
      customer.salt
    );

    if (validation) {
      const signature = await GenerateSignature({
        _id: customer._id,
        email: customer.email,
        verified: customer.verified,
      });

      return res.status(201).json({
        signature: signature,
        verified: customer.verified,
        email: customer.email,
      });
    }
  }
  return res.status(404).json({ message: "Login Error" });
};

export const CustomerVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { otp } = req.body;

  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      if (profile.otp === parseInt(otp) && profile.otp_expiry >= new Date()) {
        profile.verified = true;
        const updatedCustomerResponse = await profile.save();

        const signature = await GenerateSignature({
          _id: updatedCustomerResponse._id,
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified,
        });

        return res.status(200).json({
          signature: signature,
          verified: updatedCustomerResponse.verified,
          email: updatedCustomerResponse.email,
        });
      }
    }
  }
  return res.status(400).json({ message: "Error with OTP Validation" });
};

export const RequestOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      const { otp, expiry } = GenerateOTP();

      profile.otp = otp;
      profile.otp_expiry = expiry;

      await profile.save();
      await onRequestOtp(otp, profile.phone);

      return res
        .status(200)
        .json({ message: "OTP sent your registered phone number" });
    }
  }
  return res.status(400).json({ message: "Error with Request OTP" });
};

export const GetCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      return res.status(200).json(profile);
    }
  }
  return res.status(400).json({ message: "Error with Fetch Profile" });
};

export const EditCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  const profileInputs = plainToClass(EditCustomerProfileInputs, req.body);
  console.log(req.body);
  const profileInputErrors = await validate(profileInputs, {
    validationError: { target: true },
  });

  const { address, firstName, lastName } = profileInputs;

  if (profileInputErrors.length > 0) {
    return res.status(400).json(profileInputErrors);
  }

  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      profile.firstName = firstName;
      profile.lastName = lastName;
      profile.address = address;

      const result = await profile.save();
      return res.status(200).json(result);
    }
  }
  return res.status(400).json({ message: "Error with Update Profile" });
};

/*-------------------------------------cart section -------------------------------------------------- */

export const AddToCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id).populate("cart.food");
    let cartItems = Array();

    const { _id, unit } = <orderInputs>req.body;

    const food = await Food.findById(_id);

    if (food) {
      if (profile) {
        cartItems = profile.cart;

        if (cartItems.length > 0) {
          // check and update
          let existFoodItem = cartItems.filter(
            (item) => item.food._id.toString() === _id
          );
          if (existFoodItem.length > 0) {
            const index = cartItems.indexOf(existFoodItem[0]);

            if (unit > 0) {
              cartItems[index] = { food, unit };
            } else {
              cartItems.splice(index, 1);
            }
          } else {
            cartItems.push({ food, unit });
          }
        } else {
          // add new one
          cartItems.push({ food, unit });
        }

        if (cartItems) {
          profile.cart = cartItems as any;
          const cartResult = await profile.save();
          return res.status(200).json(profile.cart);
        }
      }
    }
  }
  return res.status(400).json({ message: "Unable to create cart" });
};
export const GetCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id).populate("cart.food");
    if (profile) {
      return res.status(200).json(profile.cart);
    }
  }
  return res.status(400).json({ message: "Cart is empty" });
};
export const DeleteCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id).populate("cart.food");
    if (profile) {
      profile.cart = [] as any;
      const cartResult = await profile.save();
      return res.status(200).json(cartResult.cart);
    }
  }
  return res.status(400).json({ message: "Cart is already empty" });
};

/*-------------------------------------Order section -------------------------------------------------- */

export const CreateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //grab current login customer

  const customer = req.user;
  if (customer) {
    //create order Id
    const orderId = `${Math.floor(Math.random() * 89999) + 1000}`;
    const profile = await Customer.findById(customer._id);
    //grab order item from request

    const cart = <[orderInputs]>req.body;

    let cartItems = Array();
    let netAmount = 0.0;
    let vandorId = "";
    //calculate order amount
    const foods = await Food.find()
      .where("_id")
      .in(cart.map((item) => item._id))
      .exec();

    foods.map((food) => {
      cart?.map(({ _id, unit }) => {
        if (food.id == _id) {
          vandorId = food.vandorId;
          netAmount += food.price * unit;
          cartItems.push({ food, unit });
        }
      });
    });

    // create order with item

    if (profile && cartItems) {
      const currentOrder = await Order.create({
        orderID: orderId,
        vandorId: vandorId,
        items: cartItems,
        totalAmount: netAmount,
        orderDate: new Date(),
        paidThrough: "COD",
        paymentResponse: "",
        orderStatus: "Waiting",
        remarks: "",
        deliveryId: "",
        appliedOffer: false,
        offerId: "",
        readyTime: 45,
      });

      profile.cart = [] as any;

      if (currentOrder) {
        profile.orders.push(currentOrder);
        const profileResponse = await profile.save();
        return res.status(200).json(currentOrder);
      }
    }
    // update order with user account
  }
  return res.status(400).json({ message: "Unable to create Order" });
};
export const GetOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id).populate("orders");

    if (profile) {
      return res.status(200).json(profile.orders);
    }
  }
  return res.status(400).json({ message: "Error with fetching orders" });
};
export const GetOrdersById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  const orderId = req.params.id;

  if (orderId) {
    const order = await Order.findById(orderId).populate("items.food");

    return res.status(200).json(order);
  }
  return res.status(400).json({ message: "Error with fetching order" });
};
