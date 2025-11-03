let currentAd = null;
let timerInterval = null;
let remainingTime = 0;

// تحميل بيانات الإعلانات
window.firebaseFunctions.onAuthStateChanged(window.firebaseAuth, async (user) => {
    if (user) {
        await loadUserAdsData(user.uid);
        loadAvailableAds();
    } else {
        window.location.href = 'index.html';
    }
});

async function loadUserAdsData(userId) {
    try {
        const { getDoc, doc } = window.firebaseFunctions;
        const docSnap = await getDoc(doc(window.firebaseDb, "users", userId));
        
        if (docSnap.exists()) {
            const userData = docSnap.data();
            updateAdsCounter(userData.dailyAds || 0);
            updateEarningsSummary(userData);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function updateAdsCounter(adsViewed) {
    const maxAds = 15;
    const progress = (adsViewed / maxAds) * 100;
    
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('adsCounter').textContent = `${adsViewed}/${maxAds} إعلان`;
    
    if (adsViewed >= maxAds) {
        document.querySelector('.start-ad-btn').disabled = true;
        document.querySelector('.start-ad-btn').textContent = 'اكتمل الحد اليومي';
    }
}

function updateEarningsSummary(userData) {
    const pointsPerAd = 10;
    const dinarPerPoint = 0.01;
    const todayPoints = (userData.dailyAds || 0) * pointsPerAd;
    const todayDinar = todayPoints * dinarPerPoint;
    
    document.getElementById('todayPoints').textContent = todayPoints + ' نقطة';
    document.getElementById('todayDinar').textContent = todayDinar.toFixed(2) + ' دينار';
    document.getElementById('totalPoints').textContent = (userData.points || 0) + ' نقطة';
}

function loadAvailableAds() {
    // في النسخة الحقيقية، سيتم جلب الإعلانات من قاعدة البيانات
    const sampleAds = [
        {
            id: 1,
            title: "منتج تجريبي",
            description: "هذا إعلان تجريبي للمنصة",
            image: "https://via.placeholder.com/300x200/0078d4/ffffff?text=إعلان+1",
            duration: 30
        },
        {
            id: 2,
            title: "عرض خاص",
            description: "استفد من هذا العرض المميز",
            image: "https://via.placeholder.com/300x200/28a745/ffffff?text=إعلان+2",
            duration: 30
        }
    ];
    
    // حفظ الإعلانات للاستخدام لاحقاً
    window.availableAds = sampleAds;
}

window.startAdSession = function() {
    if (window.availableAds && window.availableAds.length > 0) {
        // اختيار إعلان عشوائي
        const randomIndex = Math.floor(Math.random() * window.availableAds.length);
        currentAd = window.availableAds[randomIndex];
        
        showAd(currentAd);
    } else {
        alert('لا توجد إعلانات متاحة حالياً');
    }
}

function showAd(ad) {
    document.getElementById('adPlaceholder').style.display = 'none';
    document.getElementById('activeAd').style.display = 'block';
    
    document.getElementById('adImage').src = ad.image;
    document.getElementById('adTitle').textContent = ad.title;
    document.getElementById('adDescription').textContent = ad.description;
    
    startTimer(ad.duration);
}

function startTimer(duration) {
    remainingTime = duration;
    const timerElement = document.getElementById('timer');
    const completeBtn = document.getElementById('completeBtn');
    
    completeBtn.disabled = true;
    completeBtn.textContent = 'انتظر...';
    
    timerInterval = setInterval(() => {
        remainingTime--;
        timerElement.textContent = remainingTime;
        
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            completeBtn.disabled = false;
            completeBtn.textContent = 'اكتمل - احصل على النقاط';
        }
    }, 1000);
}

window.skipAd = function() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    resetAdView();
    alert('تم تخطي الإعلان - لم تحصل على نقاط');
}

window.completeAd = async function() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // منح النقاط للمستخدم
    await grantAdPoints();
    resetAdView();
}

function resetAdView() {
    document.getElementById('adPlaceholder').style.display = 'block';
    document.getElementById('activeAd').style.display = 'none';
    currentAd = null;
}

async function grantAdPoints() {
    const user = window.firebaseAuth.currentUser;
    if (!user) return;
    
    const pointsPerAd = 10;
    
    try {
        const { updateDoc, doc, increment } = window.firebaseFunctions;
        
        await updateDoc(doc(window.firebaseDb, "users", user.uid), {
            points: increment(pointsPerAd),
            dailyAds: increment(1),
            lastAdDate: new Date(),
            lastActive: new Date()
        });
        
        alert(`مبروك! لقد ربحت ${pointsPerAd} نقاط`);
        await loadUserAdsData(user.uid); // تحديث الواجهة
        
    } catch (error) {
        console.error('Error granting points:', error);
        alert('حدث خطأ في منح النقاط');
    }
}