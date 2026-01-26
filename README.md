# 🔥 Fitness Analytics Dashboard

A modern, full-stack fitness tracking application with AI-powered calorie prediction using machine learning.

![Fitness Analytics](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Flask](https://img.shields.io/badge/Flask-2.0+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎯 Core Features
- **AI-Powered Calorie Prediction** - XGBoost ML model for accurate calorie burn estimation
- **User Authentication** - Secure signup/login with session management
- **Profile Management** - Upload profile pictures and manage account settings
- **Workout Tracking** - Save and track all your workout sessions
- **Real-time Notifications** - Stay updated with workout achievements and goals
- **Interactive Dashboard** - Beautiful dark-themed UI with live statistics

### 📊 Analytics & Insights
- **Fitness Score** - Dynamic score calculation based on your activity
- **Performance Charts** - Visualize calories, duration, and heart rate trends
- **Workout History** - Complete history with detailed metrics
- **Goal Tracking** - Set and monitor fitness goals
- **Progress Insights** - Weekly, monthly, and yearly progress tracking

### 💎 Premium Features
- **3 Pricing Tiers** - Free, Pro ($9/mo), Premium ($19/mo)
- **Advanced Analytics** - Detailed performance breakdowns
- **Export Data** - Download workout data as CSV/PDF
- **AI Recommendations** - Personalized fitness suggestions (Premium)
- **1-on-1 Coaching** - Personal trainer support (Premium)

## 🚀 Tech Stack

### Backend
- **Python 3.8+**
- **Flask** - Web framework
- **SQLite** - Database
- **XGBoost** - Machine learning model
- **NumPy** - Numerical computations

### Frontend
- **HTML5, CSS3, JavaScript**
- **Chart.js** - Data visualization
- **Font Awesome** - Icons
- **Responsive Design** - Mobile-friendly

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fitness-analytics-dashboard.git
cd fitness-analytics-dashboard
```

2. **Install backend dependencies**
```bash
cd backend
pip install -r requirements.txt
```

3. **Run the backend server**
```bash
python app.py
```
Backend will run on `http://localhost:5000`

4. **Run the frontend (in a new terminal)**
```bash
cd frontend
python -m http.server 8000
```
Frontend will run on `http://localhost:8000`

5. **Open your browser**
```
http://localhost:8000/auth.html
```

## 📖 Usage

### Getting Started
1. **Sign Up** - Create a new account with username, email, and password
2. **Login** - Access your personal dashboard
3. **Calculate Calories** - Go to Workouts page and enter your exercise details
4. **Save Workouts** - Save predictions to your history
5. **Track Progress** - View analytics and monitor your fitness journey

### Input Parameters
- **Gender** - Male/Female
- **Age** - Your age in years
- **Height** - Height in centimeters
- **Weight** - Weight in kilograms
- **Duration** - Workout duration in minutes
- **Heart Rate** - Average heart rate in BPM
- **Body Temperature** - Body temperature in Celsius

## 🎨 Screenshots

### Authentication
- Modern login/signup page with discipline-themed background
- Smooth animations and form validation

### Dashboard
- Dark-themed interface with gradient accents
- Real-time statistics cards
- Fitness score with donut chart
- Calories trend line chart

### Features
- Notification system with dropdown panel
- Profile picture upload
- Upgrade modal with pricing plans
- Responsive navigation

## 📁 Project Structure

```
fitness-analytics-dashboard/
├── backend/
│   ├── app.py              # Flask application
│   ├── database.py         # Database operations
│   ├── requirements.txt    # Python dependencies
│   └── fitness_app.db      # SQLite database (auto-generated)
├── frontend/
│   ├── auth.html          # Login/Signup page
│   ├── auth.js            # Authentication logic
│   ├── auth.css           # Auth page styles
│   ├── overview.html      # Dashboard page
│   ├── overview.js        # Dashboard logic
│   ├── workouts.html      # Workout prediction page
│   ├── workouts.js        # Workout logic
│   ├── settings.html      # Settings page
│   ├── settings.js        # Settings logic
│   ├── style.css          # Global styles
│   └── Discipline.jpg     # Background image
├── calories_model.pkl     # XGBoost ML model
├── README.md
└── .gitignore
```

## 🔐 Security Features

- Password hashing (SHA-256)
- Session-based authentication
- Token validation
- Protected API endpoints
- User-specific data isolation

## 🎯 Roadmap

- [ ] Add more pages (History, Analytics, Goals)
- [ ] Integrate payment gateway (Stripe/PayPal)
- [ ] Add social sharing features
- [ ] Implement real-time chat support
- [ ] Mobile app (React Native)
- [ ] Wearable device integration
- [ ] Meal planning feature
- [ ] Video workout library

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- XGBoost for the machine learning model
- Chart.js for beautiful visualizations
- Font Awesome for icons
- Unsplash for background images

## 📞 Support

For support, email your.email@example.com or open an issue on GitHub.

---

Made with ❤️ and 💪 for fitness enthusiasts
