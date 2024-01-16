import { Request, Response, NextFunction } from "express";
import { CreateOfferInputs, EditVandorInputs, VandorLoginInput } from "../dto";
import { FindVandor, GetVandors } from "./AdminController";
import { GenerateSignature, validatePassword } from "../utility";
import { CreateFoodInputs } from "../dto/Food.dto";
import { Food, Offer, OfferDoc, Order, Vandor } from "../models";

export const VandorLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = <VandorLoginInput>req.body;

  const existingVandor = await FindVandor("", email);

  if (existingVandor !== null) {
    //validation and give access
    const validation = await validatePassword(
      password,
      existingVandor.password,
      existingVandor.salt
    );
    if (validation) {
      const signature = await GenerateSignature({
        _id: existingVandor.id,
        email: existingVandor.email,
        foodTypes: existingVandor.foodType,
        name: existingVandor.name,
      });

      return res.json(signature);
    } else {
      return res.json({ message: "password not valid" });
    }
  }

  return res.json({ message: "Login credentials not valid" });
};

export const GetVandorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const existingVandor = await FindVandor(user._id);
    return res.json(existingVandor);
  }
  return res.json({ message: "Vandor information not found" });
};

export const UpdateVandorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, address, foodTypes, phone } = <EditVandorInputs>req.body;

  const user = req.user;

  if (user) {
    const existingVandor = await FindVandor(user._id);

    if (existingVandor !== null) {
      existingVandor.name = name;
      existingVandor.foodType = foodTypes;
      existingVandor.address = address;
      existingVandor.phone = phone;

      const savedResult = await existingVandor.save();
      return res.send(savedResult);
    }
    return res.json(existingVandor);
  }
  return res.json({ message: "Vandor information not found" });
};

export const UpdateVandorCoverImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const vandor = await FindVandor(user._id);
    if (vandor !== null) {
      const files = req.files as [Express.Multer.File];

      const images = files.map((file: Express.Multer.File) => file.filename);

      vandor.coverImages.push(...images);
      const result = await vandor.save();
      return res.json(result);
    }
  }

  return res.json({ message: "Something went wrong with add food" });
};

export const UpdateVandorService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const existingVandor = await FindVandor(user._id);

    if (existingVandor !== null) {
      existingVandor.serviceAvailable = !existingVandor.serviceAvailable;

      const savedResult = await existingVandor.save();
      return res.send(savedResult);
    }
    return res.json(existingVandor);
  }
  return res.json({ message: "Vandor information not found" });
};

export const AddFood = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  // console.log(user);

  if (user) {
    const { category, description, foodType, name, price, readyTime } = <
      CreateFoodInputs
    >req.body;
    const vandor = await FindVandor(user._id);
    if (vandor !== null) {
      const files = req.files as [Express.Multer.File];

      const images = files.map((file: Express.Multer.File) => file.filename);
      console.log(images);

      const createdFood = await Food.create({
        vandorId: vandor._id,
        name: name,
        description: description,
        category: category,
        foodType: foodType,
        images: images,
        readyTime: readyTime,
        price: price,
        rating: 0,
      });

      vandor.foods.push(createdFood);
      const result = await vandor.save();
      return res.json(result);
    }
  }

  return res.json({ message: "Something went wrong with add food" });
};

export const GetFoods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const foods = await Food.find({ vandorId: user._id });
    if (foods !== null) {
      return res.json(foods);
    }
  }

  return res.json({ message: "Food information not found" });
};

export const GetCurrentOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const orders = await Order.find({ vandorId: user._id }).populate(
      "items.food"
    );

    if (orders) {
      return res.status(200).json(orders);
    }
  }

  return res.status(400).json({ message: "Order not found" });
};

export const ProcessOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const orderId = req.params.id;

  const { remarks, status, time } = req.body;

  if (orderId) {
    const order = await Order.findById(orderId);

    if (order) {
      order.orderStatus = status;
      order.remarks = remarks;
      if (time) {
        order.readyTime = time;
      }

      const orderResult = await order.save();

      if (orderResult) {
        return res.status(200).json(orderResult);
      }
    }
  }
  return res.status(400).json({ message: "Unable to process order" });
};

export const GetOrderDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const orderId = req.params.id;

  if (orderId) {
    const order = await Order.findById(orderId).populate("items.food");

    if (order) {
      return res.status(200).json(order);
    }
  }

  return res.status(400).json({ message: "Order not found" });
};

export const GetOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const offers = await Offer.find().populate("vandors");

    if (offers) {
      let currentOffers = Array();

      offers.map((offer) => {
        if (offer.vandors) {
          offer.vandors.map((vandor) => {
            if (vandor._id.toString() == user._id) {
              currentOffers.push(offer);
            }
          });
        }

        if (offer.offerType === "GENERIC") {
          currentOffers.push(offer);
        }
      });

      return res.status(200).json(currentOffers);
    }
  }
  return res.status(400).json({ message: "Offers not available" });
};
export const AddOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user) {
    const {
      banks,
      bins,
      endValidity,
      description,
      isActive,
      minValue,
      offerType,
      offerAmount,
      pincode,
      promoType,
      promocode,
      startValidity,
      title,
    } = <CreateOfferInputs>req.body;

    const vandor = await FindVandor(user._id);

    if (vandor) {
      const offer = await Offer.create({
        title,
        description,
        offerType,
        offerAmount,
        pincode,
        promocode,
        promoType,
        startValidity,
        endValidity,
        banks,
        bins,
        isActive,
        minValue,
        vandors: [vandor],
      });

      // console.log(offer);

      return res.status(200).json(offer);
    }
  }

  return res.status(400).json({ message: "Unable to add offer" });
};
export const EditOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const offerId = req.params.id;

  const user = req.user;

  if (user) {
    const {
      banks,
      bins,
      endValidity,
      description,
      isActive,
      minValue,
      offerType,
      offerAmount,
      pincode,
      promoType,
      promocode,
      startValidity,
      title,
    } = <CreateOfferInputs>req.body;

    const currentOffer = await Offer.findById(offerId);

    if (currentOffer) {
      const vandor = await FindVandor(user._id);

      if (vandor) {
        currentOffer.title = title;
        currentOffer.description = description;
        currentOffer.offerType = offerType;
        currentOffer.offerAmount = offerAmount;
        currentOffer.pincode = pincode;
        currentOffer.promocode = promocode;
        currentOffer.promoType = promoType;
        currentOffer.startValidity = startValidity;
        currentOffer.endValidity = endValidity;
        currentOffer.banks = banks;
        currentOffer.bins = bins;
        currentOffer.isActive = isActive;
        currentOffer.minValue = minValue;

        const result = await currentOffer.save();

        return res.status(200).json(result);
      }

      // console.log(offer);
    }
  }

  return res.status(400).json({ message: "Unable to add offer" });
};
