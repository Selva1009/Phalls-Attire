
# M-place - B2B E-commerce Platform for IT Products

m-place is an innovative B2B e-commerce platform designed for the buying and selling of C-class IT products. The platform connects vendors and customers through a seamless communication system, where vendors can upload their products and customers can initiate discussions before completing a purchase.

With a focus on efficiency, transparency, and ease of use, m-place offers an interactive and secure environment for business transactions. From product uploads to negotiations, every feature is crafted to streamline the process, making it easier for vendors and customers to reach deals.

### Key Features:
- Session Management: Track user activity and manage sessions effectively to enhance security and user experience.
- User Authentication and Authorization: Secure login and role-based access control to ensure that only authorized users can access specific areas of the platform.
- Email Verification with OTP: Users must verify their email addresses via OTP to ensure secure registration and communication.
- Forgot Password with OTP Verification: Users can reset their passwords using OTP verification, ensuring account security.
- Vendor Product Management: Vendors can add, update, and delete products, offering full control over their listings.
- Pagination, Filtering, and Searching: Seamlessly navigate through products with advanced pagination, filtering, and search functionality.
- Notifications: Real-time notifications to keep users informed about important events, like vendor responses or product updates.
- User Profile Updates: Users can update their profiles, ensuring that their information stays current and accurate.
- m-place is the perfect platform for businesses in the IT sector looking to sell and negotiate C-class products, providing an all-in-one solution to enhance user experience and streamline transactions.


## Installation

To set up and run both the frontend and backend of m-place, follow these steps:

### 1.Clone the repository:

```bash
https://github.com/coderpd/M_Place.git
```

### 2.Navigate into the project directory:

```bash
cd m-place

```

### 3.Set up the frontend:
  #### Navigate to the frontend folder
 ```bash
 cd frontend
```
 #### Install the dependencies:
  ```bash
 npm install
```
#### Start the frontend development server:
 ```bash
npm run dev
```

### 4.Set up the backend:
 #### Open a new terminal window and navigate to the backend folder:

 ```bash
 cd backend
```

#### Install the backend dependencies:
```bash
npm install
```

#### Start the backend server:
```bash
node server.js
```

### 5.Environment Configuration:

Ensure you have the necessary environment variables configured (e.g., for database connections, JWT secret, etc.). You can create a .env file in both the frontend and backend folders as needed.






  



 


    
## Usage
Once both the frontend and backend are running:


 ### Frontend: 
 Open your browser and go to http://localhost:3000 (or the port specified in your frontend/package.json).

 ### backend
 The backend will typically run on a separate port, like /api (or as configured in server.js).


- Visit the m-place homepage in the browser.
- Based on the credentials, sign in to either the vendor or customer page.
- If you're a new user, create an account as either a vendor or a customer.
- Vendors can access the vendor page to add, update, and delete products.
- Customers can search for specific items, add them to their cart, and notify the vendor.
- Customers and vendors can communicate with each other regarding the products before finalizing the deal.



## Features

- Session Management (based on user activity).
- User Authentication and Authorization.
- Email Verification using OTP.
- Forgot Password with OTP Verification.
- Vendor Product Management (Add, Update, Delete Products).
- Customer notify to the vendor regarding the Products.
- Pagination, Filtering, and Searching.
- User Profile Updates.


## Technologies Used






### Frontend:

#### Frameworks:
- React
- Next.js

#### Libraries:
- Axios
- React Hook Form
- React Icons
- React Select
- SweetAlert2
- Framer Motion
- React Toastify
- Lucide React
- React Country State City
- Radix UI

#### Styling:
- Tailwind CSS
- Shandcn 

### Backend:

#### Frameworks:
- Node.js
- Express.js

#### Libraries:
- MySQL2
- Bcrypt
- Bcryptjs
- JWT (JSON Web Token)
- Multer
- Nodemailer
- Body-parser
- Cookie-parser
- CORS
- Express-session
- Dotenv

### Other:
- Class Variance Authority
- CLSX
- Reacticon
- Yup
 
## Database Schema

The project uses **MySQL** as the database, and the schema name is **`mplace`**. Below are the main tables used:

| Table Name       | Description |
|-----------------|------------|
| `vendorsignup`   | Stores vendor account details (e.g., name, email, password, company details). |
| `customersignup` | Stores customer account details (e.g., name, email, password, contact details). |
| `products`       | Stores product details uploaded by vendors, including name, price, category, and image. |
| `notifications`  | Stores notifications related to customer-vendor interactions and order updates. |
| `contactus`      | Stores messages submitted via the contact form, including user inquiries. |
| `cart`           | Stores items added to the customer's cart before finalizing the purchase or deal. |




## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
## Screenshots

### Homepage
![M_Place_HomePage](https://github.com/coderpd/ATM-/blob/8782c191ff5b8768494d083b43bc81998759f377/M-Place-HomePage.png)


### Signin Page
![signinpage](https://github.com/coderpd/M_Place/blob/2de48e7b089a1a7ac83f14adec04120c084662d1/Screenshot/M-Place_Signin_page.png)


### Signup Section
![signupage](https://github.com/coderpd/M_Place/blob/4c1d1a0bd5aa2514f5b80fc4acb28049cdaee9e2/Screenshot/M-place_Signup_Page.jpeg)

### Customer Singup Page
![Customer Cart](https://github.com/coderpd/M_Place/blob/4c1d1a0bd5aa2514f5b80fc4acb28049cdaee9e2/Screenshot/M-place_CustomerSignup.png)

### Customer Product Page
![productpage](https://github.com/coderpd/M_Place/blob/4c1d1a0bd5aa2514f5b80fc4acb28049cdaee9e2/Screenshot/Customer_Product_page.png)

### Customer Cart Page
![cart page](https://github.com/coderpd/M_Place/blob/4c1d1a0bd5aa2514f5b80fc4acb28049cdaee9e2/Screenshot/Customer_Cart_page.png)

### Vendor Signup Page
![vendor signup page](https://github.com/coderpd/M_Place/blob/4c1d1a0bd5aa2514f5b80fc4acb28049cdaee9e2/Screenshot/M-place_VendorSignUp.png)

### Vendor Product Portal
![productportal](https://github.com/coderpd/M_Place/blob/4c1d1a0bd5aa2514f5b80fc4acb28049cdaee9e2/Screenshot/vendorDashboard_Product_Portal.png)

### Vendor Add Product
![addproduct](https://github.com/coderpd/M_Place/blob/4c1d1a0bd5aa2514f5b80fc4acb28049cdaee9e2/Screenshot/vendorDashboard_Add_product.png)

### Vendor Product Details
![productdetails](https://github.com/coderpd/M_Place/blob/4c1d1a0bd5aa2514f5b80fc4acb28049cdaee9e2/Screenshot/vendorDashboard_Product_Details.png)

### Vendor Notificaiton
![notificaiton](https://github.com/coderpd/M_Place/blob/4c1d1a0bd5aa2514f5b80fc4acb28049cdaee9e2/Screenshot/vendorDashboard_Notificaation.png)

### User Profile
![profile](https://github.com/coderpd/M_Place/blob/4c1d1a0bd5aa2514f5b80fc4acb28049cdaee9e2/Screenshot/User_profile.png)

## Contact

For any questions or support, feel free to reach out:

- Project Repository: https://github.com/coderpd/M_Place.git

- Email: Info@teckost.com

- LinkedIn: https://www.linkedin.com/company/teckost-it-services-pvt-ltd/
