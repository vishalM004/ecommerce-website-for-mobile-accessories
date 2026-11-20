# E-Commerce Website for Mobile Accessories

A responsive e-commerce web application developed for **M.M TIMES & MOBILES**, a mobile accessories store. The application allows customers to browse products, check phone compatibility, manage their shopping cart, and place orders. It also includes an admin dashboard for managing products, inventory, and orders.

## Project Features

### Customer Features
- Responsive interface for desktop and mobile devices.
- Browse mobile accessories by category.
- Search and filter products.
- View detailed product information.
- Add products to the shopping cart.
- Check product availability and stock.
- Find accessories compatible with specific phone models.
- Shopping cart and checkout functionality.
- Track orders.

### Admin Features
- Admin login interface.
- Dashboard for managing store information.
- Add, update, and manage products.
- Manage product categories and inventory.
- Manage phone compatibility information.
- Manage orders.
- Monitor product stock using Supabase.

### User Interface
- Animated loading screen.
- Responsive navigation and category menu.
- Interactive product cards and detail popups.
- Smooth animations and transitions.
- Mobile-friendly layouts.

## Technologies Used

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| JavaScript | Application functionality |
| Tailwind CSS | Styling and responsive design |
| Framer Motion | Animations and transitions |
| Supabase | Database and backend services |
| Vite | Development server and build tool |
| Git & GitHub | Version control and project hosting |

## Project Structure

```text
M.M TIMES/
├── public/
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   ├── supabase.js
│   ├── AdminDashboard.jsx
│   ├── AdminProducts.jsx
│   ├── AdminInventory.jsx
│   ├── AdminOrders.jsx
│   ├── AdminPhones.jsx
│   ├── AdminTempers.jsx
│   └── PickupCheckout.jsx
├── hero_images/
├── Products Images/
├── package.json
├── index.html
└── README.md
```

## Installation and Setup

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/vishalM004/ecommerce-website-for-mobile-accessories.git
```

### 2. Open the Project Folder

```bash
cd ecommerce-website-for-mobile-accessories
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Supabase

Create a `.env` file in the root directory and add your Supabase project credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the placeholder values with your own Supabase project URL and publishable/anonymous key.

Do not upload your `.env` file or private credentials to GitHub.

### 5. Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in the terminal to view the application.

## Database

The project uses Supabase for storing and managing application data, including product information, phone compatibility details, and inventory-related information.

The application connects to Supabase through its client configuration in `src/supabase.js`.

## Future Improvements

- Integrate an online payment gateway.
- Improve order tracking and notifications.
- Add customer accounts and order history.
- Deploy the application for public access.

## Author

**Vishal M**

GitHub: [vishalM004](https://github.com/vishalM004)

---

This project was developed as a practical full-stack e-commerce application to explore frontend development, database integration, inventory management, and responsive web design.
