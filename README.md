# Ready Mechanic - On-Demand Automobile Service Platform

A comprehensive web-based platform that connects customers with professional mechanics for doorstep automobile repair and maintenance services.

## 🚀 Features

### Customer Side
- **Registration/Login**: Email, Phone, Google OAuth, and OTP authentication
- **Service Booking**: 
  - Select vehicle type (Bike/Car)
  - Choose from various service types
  - Upload photos of issues
  - GPS-enabled location selection
  - Real-time booking confirmation
- **Live Tracking**: Track mechanic location and ETA (Google Maps integration ready)
- **Payment Options**: UPI, Credit/Debit Cards, Digital Wallets, Cash on Delivery
- **Order Management**: View booking history, download invoices, rate services
- **Customer Dashboard**: Comprehensive dashboard with statistics and activity tracking

### Mechanic Side
- **Registration/Login**: Complete profile setup with verification
- **Service Requests**: Accept/reject service requests within time limits
- **Job Management**: Update service status (On the Way → Service Started → Completed)
- **Navigation**: GPS navigation to customer locations
- **Earnings Dashboard**: Track daily, weekly, and monthly earnings
- **Profile Management**: Update skills, service areas, and bank details

### Admin Side
- **User Management**: Manage customers and mechanics
- **Mechanic Verification**: KYC and license verification system
- **Booking Management**: Monitor active bookings and service status
- **Payment Management**: Track payments and commissions
- **Analytics Dashboard**: 
  - Peak hours analysis
  - Most common services
  - High-demand areas
  - Revenue trends

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore Database, Storage)
- **Maps**: Google Maps API (ready for integration)
- **Payments**: Mock payment system (ready for Razorpay/Stripe integration)
- **Charts**: Chart.js for analytics
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)

## 📁 Project Structure

```
Ready-mechanic/
├── assets/
│   ├── css/
│   │   ├── form.css          # Form and dashboard styles
│   │   ├── index.css         # Homepage styles
│   │   ├── nav.css           # Navigation styles
│   │   └── services.css      # Services and booking styles
│   ├── img/                  # Images and logos
│   └── js/
│       ├── firebase-config.js    # Firebase configuration
│       ├── customer-auth.js      # Customer authentication
│       ├── mechanic-auth.js      # Mechanic authentication
│       ├── admin-auth.js         # Admin authentication
│       ├── booking.js            # Service booking logic
│       ├── customer-dashboard.js # Customer dashboard
│       ├── mechanic-dashboard.js # Mechanic dashboard
│       ├── admin-dashboard.js    # Admin dashboard
│       └── payment.js            # Payment processing
├── index.html                # Homepage
├── login.html                # Unified login page
├── register.html             # Unified registration page
├── customer-dashboard.html   # Customer dashboard
├── mechanic-dashboard.html   # Mechanic dashboard
├── admin-login.html          # Admin login page
├── admin-dashboard.html      # Admin dashboard
├── book-service.html         # Service booking page
├── payment.html              # Payment page
└── README.md                 # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase project with Authentication and Firestore enabled
- Google Maps API key (for live tracking)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ready-mechanic
   ```

2. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Enable Firestore Database
   - Enable Storage
   - Update `assets/js/firebase-config.js` with your Firebase config

3. **Set up Google Maps API** (Optional)
   - Get API key from [Google Cloud Console](https://console.cloud.google.com)
   - Update the maps integration in the tracking features

4. **Open the project**
   - Simply open `index.html` in your web browser
   - Or use a local server for better development experience

### Firebase Setup

1. **Authentication Setup**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Email/Password authentication
   - Enable Google authentication
   - Add your domain to authorized domains

2. **Firestore Database Setup**
   - Go to Firebase Console → Firestore Database
   - Create database in production mode
   - Set up security rules (see below)

3. **Storage Setup**
   - Go to Firebase Console → Storage
   - Create storage bucket
   - Set up security rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Customers can read/write their own data
    match /customers/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Mechanics can read/write their own data
    match /mechanics/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bookings are readable by involved parties
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && 
        (resource.data.customerId == request.auth.uid || 
         resource.data.mechanicId == request.auth.uid);
    }
    
    // Payments are readable by involved parties
    match /payments/{paymentId} {
      allow read, write: if request.auth != null && 
        (resource.data.customerId == request.auth.uid || 
         resource.data.mechanicId == request.auth.uid);
    }
  }
}
```

## 🔧 Configuration

### Admin Access
To access the admin dashboard, use one of these demo admin emails:
- `admin@readymechanic.com`
- `admin@example.com`
- `test@admin.com`

### Payment Integration
The payment system is currently using mock processing. To integrate real payments:

1. **Razorpay Integration**
   ```javascript
   // Add Razorpay script to payment.html
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ```

2. **Update payment.js**
   - Replace mock payment processing with actual Razorpay/Stripe calls
   - Handle webhook responses for payment verification

### Google Maps Integration
To enable live tracking:

1. Get Google Maps API key
2. Add to payment.html:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
   ```

## 📱 Usage

### For Customers
1. **Register/Login**: Create account or sign in
2. **Book Service**: Select vehicle type, service, location, and details
3. **Make Payment**: Choose payment method and complete payment
4. **Track Service**: Monitor mechanic location and service progress
5. **Rate & Review**: Provide feedback after service completion

### For Mechanics
1. **Register**: Complete profile with skills and verification documents
2. **Get Verified**: Wait for admin approval
3. **Accept Requests**: Respond to nearby service requests
4. **Update Status**: Keep customers informed of service progress
5. **Track Earnings**: Monitor income and performance

### For Admins
1. **Login**: Access admin dashboard
2. **Verify Mechanics**: Review and approve mechanic applications
3. **Monitor Bookings**: Track all active and completed services
4. **Manage Users**: Handle customer and mechanic accounts
5. **View Analytics**: Analyze platform performance and trends

## 🎨 Customization

### Styling
- Modify CSS files in `assets/css/` to change appearance
- Update color scheme in CSS variables
- Customize component styles as needed

### Features
- Add new service types in `assets/js/booking.js`
- Extend payment methods in `assets/js/payment.js`
- Add new dashboard widgets in respective dashboard files

## 🔒 Security Features

- Firebase Authentication for secure user management
- Form validation on both client and server side
- Input sanitization and validation
- Secure payment processing (when integrated)
- Role-based access control

## 📊 Database Schema

### Collections

**customers**
```javascript
{
  uid: string,
  fullName: string,
  email: string,
  phone: string,
  address: string,
  city: string,
  pincode: string,
  userType: 'customer',
  createdAt: timestamp,
  isActive: boolean
}
```

**mechanics**
```javascript
{
  uid: string,
  fullName: string,
  email: string,
  phone: string,
  experience: string,
  vehicleTypes: array,
  skills: string,
  serviceArea: string,
  address: string,
  licenseNumber: string,
  aadharNumber: string,
  bankAccount: string,
  ifscCode: string,
  userType: 'mechanic',
  status: 'pending' | 'verified' | 'rejected',
  createdAt: timestamp,
  isActive: boolean,
  rating: number,
  totalJobs: number,
  totalEarnings: number
}
```

**bookings**
```javascript
{
  customerId: string,
  customerName: string,
  mechanicId: string,
  mechanicName: string,
  vehicleType: string,
  service: object,
  address: string,
  city: string,
  pincode: string,
  landmark: string,
  description: string,
  urgency: string,
  preferredTime: string,
  status: string,
  createdAt: timestamp,
  estimatedCost: number,
  photoUrl: string
}
```

**payments**
```javascript
{
  customerId: string,
  mechanicId: string,
  bookingId: string,
  amount: number,
  method: string,
  status: string,
  transactionId: string,
  createdAt: timestamp
}
```

## 🚀 Deployment

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy`

### Other Hosting Options
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Email: support@readymechanic.com
- Phone: +91 9876543210

## 🔮 Future Enhancements

- Mobile app development (React Native/Flutter)
- Real-time chat between customers and mechanics
- Advanced analytics and reporting
- Integration with insurance companies
- Multi-language support
- Push notifications
- AI-powered service recommendations

---

**Ready Mechanic** - Making automobile services accessible, reliable, and convenient for everyone! 🚗🔧