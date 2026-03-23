"""
Test script to verify the fitness app is working correctly
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing imports...")
    try:
        import flask
        print("✓ Flask installed")
    except ImportError:
        print("✗ Flask not installed - run: pip install flask")
        return False
    
    try:
        import flask_cors
        print("✓ Flask-CORS installed")
    except ImportError:
        print("✗ Flask-CORS not installed - run: pip install flask-cors")
        return False
    
    try:
        import numpy
        print("✓ NumPy installed")
    except ImportError:
        print("✗ NumPy not installed - run: pip install numpy")
        return False
    
    try:
        import pickle
        print("✓ Pickle available")
    except ImportError:
        print("✗ Pickle not available")
        return False
    
    return True

def test_model():
    """Test if the model file exists and can be loaded"""
    print("\nTesting model file...")
    model_path = 'calories_model.pkl'
    
    if not os.path.exists(model_path):
        print(f"✗ Model file not found at {model_path}")
        return False
    
    print(f"✓ Model file exists at {model_path}")
    
    try:
        import pickle
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        print("✓ Model loaded successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to load model: {e}")
        return False

def test_database():
    """Test if database can be initialized"""
    print("\nTesting database...")
    try:
        from database import Database
        db = Database('test_fitness_app.db')
        print("✓ Database initialized successfully")
        
        # Clean up test database
        if os.path.exists('test_fitness_app.db'):
            os.remove('test_fitness_app.db')
            print("✓ Test database cleaned up")
        
        return True
    except Exception as e:
        print(f"✗ Database initialization failed: {e}")
        return False

def test_frontend_files():
    """Test if all frontend files exist"""
    print("\nTesting frontend files...")
    required_files = [
        'frontend/auth.html',
        'frontend/auth.js',
        'frontend/auth.css',
        'frontend/overview.html',
        'frontend/overview.js',
        'frontend/dashboard.css',
        'frontend/workouts.html',
        'frontend/workouts.js',
        'frontend/style.css'
    ]
    
    all_exist = True
    for file in required_files:
        if os.path.exists(file):
            print(f"✓ {file}")
        else:
            print(f"✗ {file} not found")
            all_exist = False
    
    return all_exist

def main():
    print("=" * 50)
    print("FITNESS APP TEST SUITE")
    print("=" * 50)
    
    tests = [
        ("Imports", test_imports),
        ("Model", test_model),
        ("Database", test_database),
        ("Frontend Files", test_frontend_files)
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} test crashed: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{name}: {status}")
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n✓ All tests passed! Your app is ready to run.")
        print("\nTo start the app:")
        print("1. Backend: cd backend && python app.py")
        print("2. Frontend: Open frontend/auth.html in a browser")
    else:
        print("\n✗ Some tests failed. Please fix the issues above.")
    
    return all_passed

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
