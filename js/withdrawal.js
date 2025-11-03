let userData = null;

// تحميل بيانات السحب
auth.onAuthStateChanged((user) => {
    if (user) {
        loadWithdrawalData(user.uid);
        loadWithdrawalHistory(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

function loadWithdrawalData(userId) {
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                userData = doc.data();
                updateBalanceDisplay();
                setupAccountNumber();
            }
        })
        .catch((error) => {
            console.error('Error loading withdrawal data:', error);
        });
}

function updateBalanceDisplay() {
    const points = userData.points || 0;
    const dinarValue = points * 0.01; // 1 نقطة = 0.01 دينار
    
    document.getElementById('currentBalance').textContent = points + ' نقطة';
    document.getElementById('dinarValue').textContent = dinarValue.toFixed(2) + ' دينار جزائري';
}

function setupAccountNumber() {
    document.getElementById('accountNumber').value = userData.cardNumber || '';
}

// تحديث النقاط المطلوبة عند تغيير المبلغ
document.getElementById('withdrawalAmount')?.addEventListener('input', function() {
    const amount = parseFloat(this.value) || 0;
    const requiredPoints = amount * 100; // 100 نقطة لكل دينار
    document.getElementById('requiredPoints').value = requiredPoints + ' نقطة';
});

function requestWithdrawal() {
    const user = auth.currentUser;
    if (!user || !userData) return;
    
    const method = document.getElementById('withdrawalMethod').value;
    const amount = parseFloat(document.getElementById('withdrawalAmount').value);
    const requiredPoints = amount * 100;
    
    // التحقق من الشروط
    if (amount < 500) {
        alert('الحد الأدنى للسحب هو 500 دينار');
        return;
    }
    
    if (amount > 50000) {
        alert('الحد الأقصى للسحب هو 50,000 دينار');
        return;
    }
    
    if (userData.points < requiredPoints) {
        alert('نقاطك غير كافية للسحب');
        return;
    }
    
    // التحقق من آخر سحب
    const lastWithdrawal = userData.lastWithdrawal?.toDate();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    if (lastWithdrawal && lastWithdrawal > oneWeekAgo) {
        alert('يمكنك السحب مرة واحدة فقط في الأسبوع');
        return;
    }
    
    // إنشاء طلب السحب
    const withdrawalData = {
        userId: user.uid,
        username: userData.username,
        amount: amount,
        pointsDeducted: requiredPoints,
        method: method,
        accountNumber: userData.cardNumber,
        status: 'pending',
        requestedAt: new Date(),
        processedAt: null
    };
    
    db.collection('withdrawals').add(withdrawalData)
        .then(() => {
            // خصم النقاط من رصيد المستخدم
            return db.collection('users').doc(user.uid).update({
                points: firebase.firestore.FieldValue.increment(-requiredPoints),
                lastWithdrawal: new Date()
            });
        })
        .then(() => {
            alert('تم تقديم طلب السحب بنجاح. سيتم المعالجة خلال 3-5 أيام عمل.');
            loadWithdrawalData(user.uid);
            loadWithdrawalHistory(user.uid);
            document.getElementById('withdrawalAmount').value = '';
        })
        .catch((error) => {
            console.error('Error requesting withdrawal:', error);
            alert('حدث خطأ في طلب السحب');
        });
}

function loadWithdrawalHistory(userId) {
    db.collection('withdrawals')
        .where('userId', '==', userId)
        .orderBy('requestedAt', 'desc')
        .get()
        .then((querySnapshot) => {
            const historyTable = document.getElementById('withdrawalHistory');
            
            if (querySnapshot.empty) {
                historyTable.innerHTML = '<tr><td colspan="4">لا توجد عمليات سحب سابقة</td></tr>';
                return;
            }
            
            let html = '';
            querySnapshot.forEach((doc) => {
                const withdrawal = doc.data();
                html += `
                    <tr>
                        <td>${withdrawal.requestedAt?.toDate().toLocaleDateString('ar-EG')}</td>
                        <td>${withdrawal.amount} دينار</td>
                        <td>${getMethodName(withdrawal.method)}</td>
                        <td><span class="status-${withdrawal.status}">${getStatusText(withdrawal.status)}</span></td>
                    </tr>
                `;
            });
            
            historyTable.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading withdrawal history:', error);
        });
}

function getMethodName(method) {
    const methods = {
        'ccp': 'الحساب البريدي (CCP)',
        'card': 'البطاقة الذهبية',
        'baridimob': 'Baridi Mob',
        'edahabia': 'EDAHABIA'
    };
    return methods[method] || method;
}

function getStatusText(status) {
    const statuses = {
        'pending': 'قيد المعالجة',
        'approved': 'مكتمل',
        'rejected': 'مرفوض'
    };
    return statuses[status] || status;
}