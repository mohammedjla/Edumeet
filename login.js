document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    logAction(`Login attempt for ${email}`);
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        logAction(`User ${email} logged in with role ${userData.role}`);
                        if (userData.role === 'admin') {
                            window.location.href = 'admin.html';
                        } else if (userData.role === 'teacher' && userData.approved) {
                            window.location.href = 'teacher.html';
                        } else if (userData.role === 'student' && userData.approved) {
                            window.location.href = 'student.html';
                        } else {
                            alert('Your account is not approved yet.');
                            logAction(`Login failed for ${email}: not approved`);
                        }
                    }
                });
        })
        .catch((error) => {
            alert(error.message);
            logAction(`Login error for ${email}: ${error.message}`);
        });
});