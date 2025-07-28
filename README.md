npm # 💊 Pharmacy Manager

A comprehensive pharmacy inventory management system built with **Next.js** and **Supabase**. This application provides a modern, secure, and scalable solution for pharmacy owners to track medicine purchases, manage inventory, and monitor expiry dates.

## ✨ Features

- 🛒 **Purchase Entry**: Record daily medicine purchases from wholesalers
- 📦 **Inventory Management**: Monitor stock levels and track medicine inventory
- ⏰ **Expiry Tracking**: Monitor medicine expiry dates and prevent losses
- 📊 **Stock Analytics**: View purchase trends and inventory insights
- 🔐 **Secure Database**: Powered by Supabase for reliable data storage
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- ⚡ **Fast Performance**: Built with Next.js for optimal performance

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd medapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Rename `.env.example` to `.env.local` and add your credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```

4. **Create database tables**
   
   In your Supabase SQL editor, run:
   ```sql
   -- Medicines master table
   CREATE TABLE medicines (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     generic_name TEXT,
     company TEXT NOT NULL,
     category TEXT,
     unit_type TEXT DEFAULT 'strips',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Purchase entries table
   CREATE TABLE purchases (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     medicine_id UUID REFERENCES medicines(id),
     supplier_name TEXT NOT NULL,
     quantity INTEGER NOT NULL,
     rate_per_unit DECIMAL(10,2) NOT NULL,
     total_amount DECIMAL(10,2) NOT NULL,
     batch_number TEXT,
     expiry_date DATE NOT NULL,
     purchase_date DATE DEFAULT CURRENT_DATE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Suppliers table
   CREATE TABLE suppliers (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     contact_person TEXT,
     phone TEXT,
     email TEXT,
     address TEXT,
     gst_number TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to access the Pharmacy Admin Panel directly.

## 🛠️ Built With

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[Supabase](https://supabase.com/)** - Backend as a Service (Database, Auth, Storage)
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[ESLint](https://eslint.org/)** - Code linting and formatting

## 📁 Project Structure

```
medapp/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── admin/        # Pharmacy admin panel (default screen)
│   │   │   ├── purchases/    # Purchase entry management
│   │   │   ├── inventory/    # Stock level monitoring
│   │   │   ├── expiry/       # Expiry tracking
│   │   │   └── settings/     # Pharmacy configuration
│   │   └── page.tsx      # Redirects to admin panel
│   └── lib/              # Utility functions and configurations
│       └── supabase.ts   # Supabase client with pharmacy types
├── public/               # Static assets
├── .env.local           # Environment variables (create from .env.example)
├── .env.example         # Environment variables template
└── README.md
```

## 🔒 Security

- Environment variables are used for sensitive data
- Supabase Row Level Security (RLS) can be enabled for additional data protection
- All API calls are made through Supabase's secure client

## 📈 Future Enhancements

- 🔐 User authentication and role-based access
- 📱 Mobile app version
- 📧 Email/SMS notifications for expiry alerts
- 💰 Purchase cost analysis and profit tracking
- 🏪 Multi-pharmacy chain support
- 📊 Advanced analytics and reporting dashboard
- 🔄 Integration with suppliers for automated ordering
- 📋 GST and tax calculation features

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help setting up the project, please open an issue or contact the development team.

---

**Happy coding! 🚀**
