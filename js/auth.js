/* =============================================
   SKYVOYAGE — Authentication Module
   ============================================= */

const Auth = {
  init() {
    this.setupLoginForm();
    this.setupRegisterForm();
  },

  setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        Toast.show('Error', 'Please fill in all fields.', 'error');
        return;
      }

      const users = DB.getAll('users');
      const user = users.find(u => u.email === email && u.password === password);

      if (!user) {
        Toast.show('Login Failed', 'Invalid email or password.', 'error');
        return;
      }

      App.login(user);
    });
  },

  setupRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstName = document.getElementById('reg-firstname').value.trim();
      const lastName = document.getElementById('reg-lastname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;

      // Validation
      if (!firstName || !lastName || !email || !password) {
        Toast.show('Error', 'Please fill in all required fields.', 'error');
        return;
      }

      if (password.length < 6) {
        Toast.show('Error', 'Password must be at least 6 characters.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        Toast.show('Error', 'Passwords do not match.', 'error');
        return;
      }

      const users = DB.getAll('users');
      if (users.find(u => u.email === email)) {
        Toast.show('Error', 'An account with this email already exists.', 'error');
        return;
      }

      const newUser = {
        id: DB.generateId(),
        email,
        password,
        firstName,
        lastName,
        phone,
        role: 'customer',
        verified: true,
        createdAt: new Date().toISOString()
      };

      DB.add('users', newUser);

      // Add welcome notification
      Notifications.add({
        userId: newUser.id,
        type: 'welcome',
        title: 'Welcome to SkyVoyage! ✈️',
        message: 'Your account has been created. Start exploring flights and book your next adventure!',
        icon: 'party-popper'
      });

      Toast.show('Account Created!', 'Welcome to SkyVoyage! You can now sign in.', 'success');
      App.navigate('login');
    });
  },

  // Password reset (simulated)
  resetPassword(email) {
    const users = DB.getAll('users');
    const user = users.find(u => u.email === email);
    if (!user) {
      Toast.show('Error', 'No account found with this email.', 'error');
      return;
    }
    Toast.show('Email Sent', 'Password reset link sent to your email (simulated).', 'success');
  }
};

// Init auth forms when DOM ready
document.addEventListener('DOMContentLoaded', () => Auth.init());
