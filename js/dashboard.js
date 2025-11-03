// تحميل بيانات المستخدم
window.firebaseFunctions.onAuthStateChanged(window.firebaseAuth, async (user) => {
    if (user) {
        await loadUserData(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

async function loadUserData(userId) {
    try {
        const { getDoc, doc } = window.firebaseFunctions;
        const docSnap = await getDoc(doc(window.firebaseDb, "users", userId));
        
        if (docSnap.exists()) {
            const userData = docSnap.data();
            document.getElementById('userName').textContent = userData.username;
            document.getElementById('pointsBalance').textContent = userData.points + ' نقطة';
            document.getElementById('todayEarnings').textContent = calculateTodayEarnings(userData) + ' دينار';
            document.getElementById('referralsCount').textContent = userData.referrals + ' مستخدم';
            document.getElementById('todayAds').textContent = (userData.dailyAds || 0) + '/15';
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function calculateTodayEarnings(userData) {
    // حساب الأرباح بناءً على الإعلانات اليومية
    const pointsPerAd = 10; // 10 نقاط لكل إعلان
    const dinarPerPoint = 0.01; // 1 نقطة = 0.01 دينار
    
    return ((userData.dailyAds || 0) * pointsPerAd * dinarPerPoint).toFixed(2);
}

window.logout = async function() {
    try {
        const { signOut } = window.firebaseFunctions;
        await signOut(window.firebaseAuth);
        window.location.href = 'index.html';
    } catch (error) {
        alert('خطأ في تسجيل الخروج: ' + error.message);
    }
}