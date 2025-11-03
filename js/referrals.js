let userReferralCode = '';

// تحميل بيانات الإحالة
auth.onAuthStateChanged((user) => {
    if (user) {
        loadReferralData(user.uid);
        loadReferralsList(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

function loadReferralData(userId) {
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                userReferralCode = userData.referralCode;
                
                // تحديث الواجهة
                document.getElementById('referralCode').textContent = userReferralCode;
                document.getElementById('referralsCount').textContent = userData.referrals || 0;
                document.getElementById('referralEarnings').textContent = calculateReferralEarnings(userData) + ' دينار';
                
                // إنشاء رابط الإحالة
                const referralLink = `${window.location.origin}/register.html?ref=${userReferralCode}`;
                document.getElementById('referralLink').value = referralLink;
            }
        })
        .catch((error) => {
            console.error('Error loading referral data:', error);
        });
}

function calculateReferralEarnings(userData) {
    // مثال: 10% من أرباح المُحالين
    const referralEarnings = userData.referralEarnings || 0;
    return (referralEarnings * 0.01).toFixed(2); // تحويل النقاط إلى دينار
}

function copyReferralCode() {
    navigator.clipboard.writeText(userReferralCode)
        .then(() => {
            alert('تم نسخ رقم الإحالة: ' + userReferralCode);
        })
        .catch(() => {
            // طريقة بديلة للنسخ
            const tempInput = document.createElement('input');
            tempInput.value = userReferralCode;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            alert('تم نسخ رقم الإحالة: ' + userReferralCode);
        });
}

function copyReferralLink() {
    const referralLink = document.getElementById('referralLink').value;
    navigator.clipboard.writeText(referralLink)
        .then(() => {
            alert('تم نسخ رابط الإحالة');
        })
        .catch(() => {
            const tempInput = document.createElement('input');
            tempInput.value = referralLink;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            alert('تم نسخ رابط الإحالة');
        });
}

function loadReferralsList(userId) {
    db.collection('users')
        .where('referredBy', '==', userId)
        .get()
        .then((querySnapshot) => {
            const referralsList = document.getElementById('referralsList');
            
            if (querySnapshot.empty) {
                referralsList.innerHTML = '<p>لا توجد إحالات حتى الآن</p>';
                return;
            }
            
            let html = '';
            querySnapshot.forEach((doc) => {
                const user = doc.data();
                html += `
                    <div class="referral-item">
                        <strong>${user.username}</strong>
                        <span>تاريخ التسجيل: ${new Date(user.joinedAt?.toDate()).toLocaleDateString('ar-EG')}</span>
                        <span>النقاط: ${user.points || 0}</span>
                    </div>
                `;
            });
            
            referralsList.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading referrals list:', error);
        });
}