// تحميل بيانات الإدارة
auth.onAuthStateChanged((user) => {
    if (user) {
        // التحقق من صلاحية المدير (يمكنك إضافة تحقق أكثر تعقيداً)
        checkAdminAccess(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

function checkAdminAccess(userId) {
    // في الإصدار النهائي، يجب التحقق من صلاحية المستخدم في قاعدة البيانات
    db.collection('admins').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                loadAdminData();
            } else {
                // إذا لم يكن مديراً، ارجع للوحة التحكم العادية
                window.location.href = 'dashboard.html';
            }
        })
        .catch(() => {
            // طريقة بديلة للتحقق (مؤقتة للتطوير)
            if (userId === 'your-admin-user-id') {
                loadAdminData();
            } else {
                window.location.href = 'dashboard.html';
            }
        });
}

function loadAdminData() {
    loadDashboardStats();
    loadUsersTable();
    loadWithdrawalRequests();
    loadFinancialReports();
}

function loadDashboardStats() {
    // إجمالي المستخدمين
    db.collection('users').get()
        .then((snapshot) => {
            document.getElementById('totalUsers').textContent = snapshot.size;
        });
    
    // المستخدمين النشطين (استخدموا الموقع في آخر 7 أيام)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    db.collection('users')
        .where('lastActive', '>=', sevenDaysAgo)
        .get()
        .then((snapshot) => {
            document.getElementById('activeUsers').textContent = snapshot.size;
        });
    
    // إجمالي الإعلانات المعروضة
    db.collection('adViews').get()
        .then((snapshot) => {
            document.getElementById('totalAds').textContent = snapshot.size;
        });
    
    // الأرباح اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    db.collection('platformEarnings')
        .where('date', '>=', today)
        .get()
        .then((snapshot) => {
            let total = 0;
            snapshot.forEach(doc => {
                total += doc.data().amount || 0;
            });
            document.getElementById('todayEarnings').textContent = total.toFixed(2) + ' دينار';
        });
}

function loadUsersTable() {
    db.collection('users')
        .orderBy('joinedAt', 'desc')
        .limit(50)
        .get()
        .then((querySnapshot) => {
            const usersTable = document.getElementById('usersTable');
            let html = '';
            
            querySnapshot.forEach((doc) => {
                const user = doc.data();
                html += `
                    <tr>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.points || 0}</td>
                        <td>${user.referrals || 0}</td>
                        <td>${user.joinedAt?.toDate().toLocaleDateString('ar-EG')}</td>
                        <td>
                            <button onclick="editUser('${doc.id}')">تعديل</button>
                            <button onclick="deleteUser('${doc.id}')">حذف</button>
                        </td>
                    </tr>
                `;
            });
            
            usersTable.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading users:', error);
        });
}

function loadWithdrawalRequests() {
    db.collection('withdrawals')
        .where('status', '==', 'pending')
        .orderBy('requestedAt', 'desc')
        .get()
        .then((querySnapshot) => {
            const withdrawalsTable = document.getElementById('withdrawalsTable');
            
            if (querySnapshot.empty) {
                withdrawalsTable.innerHTML = '<tr><td colspan="6">لا توجد طلبات سحب معلقة</td></tr>';
                return;
            }
            
            let html = '';
            querySnapshot.forEach((doc) => {
                const withdrawal = doc.data();
                html += `
                    <tr>
                        <td>${withdrawal.username}</td>
                        <td>${withdrawal.amount} دينار</td>
                        <td>${getMethodName(withdrawal.method)}</td>
                        <td>${withdrawal.accountNumber}</td>
                        <td>${withdrawal.requestedAt?.toDate().toLocaleDateString('ar-EG')}</td>
                        <td>
                            <button onclick="approveWithdrawal('${doc.id}')">موافقة</button>
                            <button onclick="rejectWithdrawal('${doc.id}')">رفض</button>
                        </td>
                    </tr>
                `;
            });
            
            withdrawalsTable.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading withdrawals:', error);
        });
}

function loadFinancialReports() {
    // إجمالي أرباح المنصة
    db.collection('platformEarnings').get()
        .then((snapshot) => {
            let total = 0;
            snapshot.forEach(doc => {
                total += doc.data().amount || 0;
            });
            document.getElementById('totalPlatformEarnings').textContent = total.toFixed(2) + ' دينار';
        });
    
    // إجمالي المسحوبات
    db.collection('withdrawals')
        .where('status', '==', 'approved')
        .get()
        .then((snapshot) => {
            let total = 0;
            snapshot.forEach(doc => {
                total += doc.data().amount || 0;
            });
            document.getElementById('totalWithdrawals').textContent = total.toFixed(2) + ' دينار';
        });
    
    // صافي الأرباح (سيتم حسابه بناءً على البيانات الفعلية)
    document.getElementById('netEarnings').textContent = '0 دينار';
}

// وظائف التبويب
function openTab(tabName) {
    // إخفاء جميع محتويات التبويبات
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }
    
    // إلغاء تنشيط جميع أزرار التبويبات
    const tabButtons = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }
    
    // إظهار التبويب المحدد
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

// وظائف إدارة المستخدمين
function editUser(userId) {
    // في الإصدار النهائي، إظهار نموذج تعديل المستخدم
    alert('تعديل المستخدم: ' + userId);
}

function deleteUser(userId) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        db.collection('users').doc(userId).delete()
            .then(() => {
                alert('تم حذف المستخدم بنجاح');
                loadUsersTable();
            })
            .catch((error) => {
                alert('خطأ في حذف المستخدم: ' + error.message);
            });
    }
}

// وظائف إدارة طلبات السحب
function approveWithdrawal(withdrawalId) {
    if (confirm('هل تريد الموافقة على طلب السحب هذا؟')) {
        db.collection('withdrawals').doc(withdrawalId).update({
            status: 'approved',
            processedAt: new Date()
        })
        .then(() => {
            alert('تمت الموافقة على طلب السحب');
            loadWithdrawalRequests();
            loadFinancialReports();
        })
        .catch((error) => {
            alert('خطأ في الموافقة على طلب السحب: ' + error.message);
        });
    }
}

function rejectWithdrawal(withdrawalId) {
    const reason = prompt('يرجى إدخال سبب الرفض:');
    if (reason) {
        db.collection('withdrawals').doc(withdrawalId).update({
            status: 'rejected',
            rejectionReason: reason,
            processedAt: new Date()
        })
        .then(() => {
            alert('تم رفض طلب السحب');
            loadWithdrawalRequests();
        })
        .catch((error) => {
            alert('خطأ في رفض طلب السحب: ' + error.message);
        });
    }
}

// وظائف إدارة الإعلانات
function showAddAdForm() {
    // في الإصدار النهائي، إظهار نموذج إضافة إعلان
    alert('نموذج إضافة إعلان جديد سيظهر هنا');
}