document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const department = document.getElementById('department').value;

    logAction(`Registration attempt for ${email}`);
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: 'student',
                approved: false,
                department: department
            }).then(() => {
                logAction(`Student ${email} registered, pending approval`);
                alert('Registration successful. Waiting for admin approval.');
                window.location.href = 'index.html';
            });
        })
        .catch((error) => {
            alert(error.message);
            logAction(`Registration error for ${email}: ${error.message}`);
        });
});