auth.onAuthStateChanged((user) => {
    if (!user || !checkRole(user.uid, 'student')) {
        window.location.href = 'index.html';
    }
    window.currentStudentId = user.uid; // Store for use in functions
    loadTeachersForMessage();
});

document.getElementById('logout').addEventListener('click', () => {
    auth.signOut().then(() => {
        logAction('Student logged out');
        window.location.href = 'index.html';
    });
});

function checkRole(uid, expectedRole) {
    db.collection('users').doc(uid).get().then((doc) => {
        if (doc.exists && doc.data().role === expectedRole && doc.data().approved) {
            searchTeachers();
            loadMyAppointments();
            return true;
        } else {
            alert('Unauthorized access.');
            window.location.href = 'index.html';
            return false;
        }
    });
}

document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    searchTeachers();
});

function searchTeachers() {
    const searchName = document.getElementById('searchName').value.toLowerCase();
    const searchDepartment = document.getElementById('searchDepartment').value.toLowerCase();
    db.collection('teachers').get().then((snapshot) => {
        const teachersList = document.getElementById('teachersList');
        teachersList.innerHTML = '';
        snapshot.forEach((doc) => {
            const teacher = doc.data();
            if ((searchName === '' || teacher.name.toLowerCase().includes(searchName)) &&
                (searchDepartment === '' || teacher.department.toLowerCase() === searchDepartment)) {
                teachersList.innerHTML += `
                    <div class="item">
                        ${teacher.name} - ${teacher.department}
                        <button onclick="bookAppointment('${doc.id}')">Book Appointment</button>
                    </div>`;
            }
        });
    });
}

function bookAppointment(teacherId) {
    db.collection('teachers').doc(teacherId).get().then((doc) => {
        const teacher = doc.data();
        const slots = teacher.available_slots;
        let slotOptions = '<select id="slotSelect" required>';
        slots.forEach(slot => {
            slotOptions += `<option value="${slot}">${slot}</option>`;
        });
        slotOptions += '</select>';
        const purpose = prompt('Enter purpose for the appointment:');
        if (purpose) {
            const slot = document.getElementById('slotSelect') ? document.getElementById('slotSelect').value : slots[0];
            db.collection('appointments').add({
                student_id: currentStudentId,
                teacher_id: teacherId,
                slot: slot,
                purpose: purpose,
                status: 'pending'
            }).then(() => {
                logAction(`Appointment booked by ${currentStudentId} with ${teacherId} for ${slot}`);
                alert('Appointment request sent.');
                loadMyAppointments();
            });
        }
    });
}

function loadTeachersForMessage() {
    db.collection('teachers').get().then((snapshot) => {
        const teacherSelect = document.getElementById('teacherSelect');
        teacherSelect.innerHTML = '<option value="">Select a teacher</option>';
        snapshot.forEach((doc) => {
            const teacher = doc.data();
            teacherSelect.innerHTML += `<option value="${doc.id}">${teacher.name}</option>`;
        });
    });
}

document.getElementById('messageForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const teacherId = document.getElementById('teacherSelect').value;
    const message = document.getElementById('message').value;
    db.collection('messages').add({
        sender_id: currentStudentId,
        receiver_id: teacherId,
        message: message,
        timestamp: Date.now()
    }).then(() => {
        logAction(`Message sent by ${currentStudentId} to ${teacherId}`);
        alert('Message sent.');
        document.getElementById('message').value = '';
    });
});

function loadMyAppointments() {
    db.collection('appointments').where('student_id', '==', currentStudentId).get()
        .then((snapshot) => {
            const appointments = document.getElementById('myAppointments');
            appointments.innerHTML = '';
            snapshot.forEach((doc) => {
                const appt = doc.data();
                db.collection('teachers').doc(appt.teacher_id).get().then((teacherDoc) => {
                    const teacher = teacherDoc.data();
                    appointments.innerHTML += `<div class="item">${teacher.name} - ${appt.slot} - ${appt.status}</div>`;
                });
            });
        });
}