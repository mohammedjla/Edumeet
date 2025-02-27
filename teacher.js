auth.onAuthStateChanged((user) => {
    if (!user || !checkRole(user.uid, 'teacher')) {
        window.location.href = 'index.html';
    }
    window.currentTeacherId = user.uid; // Store for use in functions
});

document.getElementById('logout').addEventListener('click', () => {
    auth.signOut().then(() => {
        logAction('Teacher logged out');
        window.location.href = 'index.html';
    });
});

function checkRole(uid, expectedRole) {
    db.collection('users').doc(uid).get().then((doc) => {
        if (doc.exists && doc.data().role === expectedRole && doc.data().approved) {
            loadAppointmentRequests();
            loadMessages();
            loadAllAppointments();
            return true;
        } else {
            alert('Unauthorized access.');
            window.location.href = 'index.html';
            return false;
        }
    });
}

document.getElementById('addSlotForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const slot = document.getElementById('slot').value;
    db.collection('teachers').doc(currentTeacherId).update({
        available_slots: firebase.firestore.FieldValue.arrayUnion(slot)
    }).then(() => {
        logAction(`Slot ${slot} added by teacher ${currentTeacherId}`);
        alert('Slot added successfully.');
    });
});

function loadAppointmentRequests() {
    db.collection('appointments').where('teacher_id', '==', currentTeacherId)
        .where('status', '==', 'pending').get()
        .then((snapshot) => {
            const requests = document.getElementById('appointmentRequests');
            requests.innerHTML = '';
            snapshot.forEach((doc) => {
                const appt = doc.data();
                db.collection('users').doc(appt.student_id).get().then((studentDoc) => {
                    const student = studentDoc.data();
                    requests.innerHTML += `
                        <div class="item">
                            ${student.name} - ${appt.slot} - ${appt.purpose}
                            <button onclick="approveAppointment('${doc.id}', '${appt.slot}')">Approve</button>
                            <button onclick="cancelAppointment('${doc.id}')">Cancel</button>
                        </div>`;
                });
            });
        });
}

function approveAppointment(apptId, slot) {
    db.collection('appointments').doc(apptId).update({ status: 'approved' })
        .then(() => {
            db.collection('teachers').doc(currentTeacherId).update({
                available_slots: firebase.firestore.FieldValue.arrayRemove(slot)
            }).then(() => {
                logAction(`Appointment ${apptId} approved and slot ${slot} removed`);
                loadAppointmentRequests();
                loadAllAppointments();
            });
        });
}

function cancelAppointment(apptId) {
    db.collection('appointments').doc(apptId).update({ status: 'canceled' })
        .then(() => {
            logAction(`Appointment ${apptId} canceled`);
            loadAppointmentRequests();
            loadAllAppointments();
        });
}

function loadMessages() {
    db.collection('messages').where('receiver_id', '==', currentTeacherId)
        .orderBy('timestamp', 'desc').get()
        .then((snapshot) => {
            const messages = document.getElementById('messages');
            messages.innerHTML = '';
            snapshot.forEach((doc) => {
                const msg = doc.data();
                db.collection('users').doc(msg.sender_id).get().then((senderDoc) => {
                    const sender = senderDoc.data();
                    messages.innerHTML += `<div class="item">${sender.name}: ${msg.message} (${new Date(msg.timestamp).toLocaleString()})</div>`;
                });
            });
        });
}

function loadAllAppointments() {
    db.collection('appointments').where('teacher_id', '==', currentTeacherId).get()
        .then((snapshot) => {
            const appointments = document.getElementById('allAppointments');
            appointments.innerHTML = '';
            snapshot.forEach((doc) => {
                const appt = doc.data();
                db.collection('users').doc(appt.student_id).get().then((studentDoc) => {
                    const student = studentDoc.data();
                    appointments.innerHTML += `<div class="item">${student.name} - ${appt.slot} - ${appt.status}</div>`;
                });
            });
        });
}