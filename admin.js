auth.onAuthStateChanged((user) => {
    if (!user || !checkRole(user.uid, 'admin')) {
        window.location.href = 'index.html';
    }
});

document.getElementById('logout').addEventListener('click', () => {
    auth.signOut().then(() => {
        logAction('Admin logged out');
        window.location.href = 'index.html';
    });
});

function checkRole(uid, expectedRole) {
    db.collection('users').doc(uid).get().then((doc) => {
        if (doc.exists && doc.data().role === expectedRole) {
            loadTeachers();
            loadPendingStudents();
            return true;
        } else {
            alert('Unauthorized access.');
            window.location.href = 'index.html';
            return false;
        }
    });
}

function loadTeachers() {
    db.collection('teachers').get().then((snapshot) => {
        const teachersList = document.getElementById('teachersList');
        teachersList.innerHTML = '';
        snapshot.forEach((doc) => {
            const teacher = doc.data();
            teachersList.innerHTML += `<div class="item">${teacher.name} - ${teacher.department}</div>`;
        });
    });
}

function loadPendingStudents() {
    db.collection('users').where('role', '==', 'student').where('approved', '==', false).get()
        .then((snapshot) => {
            const pendingStudents = document.getElementById('pendingStudents');
            pendingStudents.innerHTML = '';
            snapshot.forEach((doc) => {
                const student = doc.data();
                pendingStudents.innerHTML += `
                    <div class="item">
                        ${student.name} - ${student.email}
                        <button onclick="approveStudent('${doc.id}')">Approve</button>
                    </div>`;
            });
        });
}

function approveStudent(studentId) {
    db.collection('users').doc(studentId).update({ approved: true })
        .then(() => {
            logAction(`Student ${studentId} approved`);
            loadPendingStudents();
        });
}

document.getElementById('addTeacherForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('teacherName').value;
    const email = document.getElementById('teacherEmail').value;
    const password = document.getElementById('teacherPassword').value;
    const department = document.getElementById('teacherDepartment').value;
    const subjects = document.getElementById('teacherSubjects').value.split(',');

    logAction(`Adding teacher ${email}`);
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            Promise.all([
                db.collection('users').doc(user.uid).set({
                    name: name,
                    email: email,
                    role: 'teacher',
                    approved: true
                }),
                db.collection('teachers').doc(user.uid).set({
                    name: name,
                    department: department,
                    subjects: subjects,
                    available_slots: []
                })
            ]).then(() => {
                logAction(`Teacher ${email} added`);
                alert('Teacher added successfully.');
                loadTeachers();
            });
        })
        .catch((error) => {
            alert(error.message);
            logAction(`Error adding teacher ${email}: ${error.message}`);
        });
});