require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const { sendOTP } = require("./utils/mailer"); 
const cors = require("cors");
const app = express();
const port = Number(process.env.SERVER_PORT || process.env.API_PORT) || 5000;

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

// Routes
const CustomerAuthRouter = require("./routes/CustomerSignupAuth");
app.use("/api/auth/customer", CustomerAuthRouter); 

const VendorAuthRouter = require("./routes/VendorSignupAuth");
app.use("/api/auth/vendor", VendorAuthRouter);  

const Signin = require("./routes/SigninAuth");
app.use("/api/auth", Signin);  

const ForgotPassword = require("./routes/forgotPasswordOtp");
app.use("/api/forgotpassword", ForgotPassword);  

const contactUsRouter = require("./routes/ContactUs");
app.use("/api/contact", contactUsRouter);

const getvendor = require("./routes/getvendor");
app.use("/api/auth", getvendor);

const productsRouter = require("./routes/products");
app.use("/api/auth/products", productsRouter);

const CustomerEdit = require("./routes/Customer");
app.use("/api/customer-edit", CustomerEdit);

const notifyVendorRouter =require("./routes/notifications")
app.use("/api/notification", notifyVendorRouter);

const cartRouter = require("./routes/cart");
app.use("/api/cart", cartRouter);

const customerUserSignUp = require("./routes/customerUserSignUp");
app.use("/api/auth/customerUserSignUp",customerUserSignUp);

const vendorUserSignup = require("./routes/vendorUserSignup")
app.use("/api/auth/vendor", vendorUserSignup);

const po =require("./routes/po")
app.use("/api/po",po)

const PoVendorUser =require("./routes/PoVendorUser")
app.use("/api/PoVendorUser",PoVendorUser)

const addressRouter = require("./routes/address");
app.use("/api/address", addressRouter);

const ordersRouter = require("./routes/orders");
app.use("/api/orders", ordersRouter);

const favouritesRouter = require("./routes/favourites");
app.use("/api/favourites", favouritesRouter);

const vendorProductRouter = require("./routes/vendorProduct");
app.use("/api/vendor", vendorProductRouter);

const userRouter = require("./routes/user");
app.use("/api/user", userRouter);

const paymentRouter = require("./routes/payments");
app.use("/api/payments", paymentRouter);

app.listen(port,'0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});


