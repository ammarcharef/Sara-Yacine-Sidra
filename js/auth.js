// الانتظار حتى يتم تحميل Firebase
document.addEventListener('DOMContentLoaded', function() {
    // تسجيل الدخول
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // إضافة تأثير التحميل
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'جاري التسجيل...';
        submitBtn.disabled = true;
        
        try {
            const { signInWithEmailAndPassword } = window.firebaseFunctions;
            const userCredential = await signInWithEmailAndPassword(window.firebaseAuth, email, password);
            
            // تحويل إلى لوحة التحكم
            window.location.href = 'dashboard.html';
        } catch (error) {
            // استعادة الزر
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            let errorMessage = 'خطأ في تسجيل الدخول';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'لا يوجد حساب بهذا البريد الإلكتروني';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'كلمة المرور غير صحيحة';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'بريد إلكتروني غير صحيح';
                    break;
                default:
                    errorMessage = error.message;
            }
            alert(errorMessage);
        }
    });

    // إنشاء حساب جديد
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const cardNumber = document.getElementById('cardNumber').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // التحقق من كلمات المرور
        if (password !== confirmPassword) {
            alert('كلمات المرور غير متطابقة');
            return;
        }
        
        if (password.length < 8) {
            alert('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return;
        }
        
        // إضافة تأثير التحميل
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'جاري إنشاء الحساب...';
        submitBtn.disabled = true;
        
        try {
            const { createUserWithEmailAndPassword, doc, setDoc, collection } = window.firebaseFunctions;
            
            // إنشاء المستخدم في Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
            const user = userCredential.user;
            
            // التحقق من كود الإحالة
            const urlParams = new URLSearchParams(window.location.search);
            const referralCode = urlParams.get('ref');
            
            // بيانات المستخدم الأساسية
            const userData = {
                username: username,
                email: email,
                phone: phone,
                cardNumber: cardNumber,
                points: 100, // نقاط ترحيبية
                totalEarnings: 0,
                referrals: 0,
                referralCode: generateReferralCode(),
                joinedAt: new Date(),
                dailyAds: 0,
                lastAdDate: null,
                lastActive: new Date()
            };
            
            // إذا كان هناك كود إحالة
            if (referralCode) {
                userData.referredBy = referralCode;
                await grantReferralBonus(referralCode, user.uid);
            }
            
            // حفظ بيانات المستخدم في Firestore
            await setDoc(doc(window.firebaseDb, "users", user.uid), userData);
            
            alert('تم إنشاء الحساب بنجاح! 🎉\nلقد حصلت على 100 نقطة ترحيبية');
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            // استعادة الزر
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            let errorMessage = 'خطأ في إنشاء الحساب';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'هذا البريد الإلكتروني مستخدم بالفعل';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'كلمة المرور ضعيفة جداً';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'بريد إلكتروني غير صحيح';
                    break;
                default:
                    errorMessage = error.message;
            }
            alert(errorMessage);
        }
    });
});

// الدخول بحساب Google
window.loginWithGoogle = async function() {
    try {
        const { signInWithPopup, doc, setDoc, getDocs, query, where, collection } = window.firebaseFunctions;
        
        const result = await signInWithPopup(window.firebaseAuth, window.firebaseGoogleProvider);
        const user = result.user;
        
        // التحقق إذا كان المستخدم جديداً
        if (result._tokenResponse.isNewUser) {
            // إنشاء حساب جديد مع بيانات Google
            await setDoc(doc(window.firebaseDb, "users", user.uid), {
                username: user.displayName || user.email.split('@')[0],
                email: user.email,
                phone: '',
                cardNumber: '',
                points: 100,
                totalEarnings: 0,
                referrals: 0,
                referralCode: generateReferralCode(),
                joinedAt: new Date(),
                dailyAds: 0,
                lastAdDate: null,
                lastActive: new Date(),
                isGoogleAccount: true
            });
        }
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('خطأ في الدخول بحساب Google: ' + error.message);
    }
}

// توليد كود إحالة
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// البحث عن المُحيل باستخدام كود الإحالة
async function findReferrerId(referralCode) {
    try {
        const { getDocs, query, where, collection } = window.firebaseFunctions;
        
        const q = query(
            collection(window.firebaseDb, "users"), 
            where("referralCode", "==", referralCode)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id;
        }
        return null;
    } catch (error) {
        console.error('Error finding referrer:', error);
        return null;
    }
}

// منح مكافأة الإحالة
async function grantReferralBonus(referralCode, newUserId) {
    try {
        const referrerId = await findReferrerId(referralCode);
        if (referrerId) {
            const { updateDoc, doc, increment } = window.firebaseFunctions;
            
            // منح 100 نقطة للمُحيل
            await updateDoc(doc(window.firebaseDb, "users", referrerId), {
                points: increment(100),
                referrals: increment(1),
                referralEarnings: increment(100)
            });
        }
    } catch (error) {
        console.error('Error granting referral bonus:', error);
    }
}

// مراقبة حالة المصادقة
window.firebaseFunctions.onAuthStateChanged(window.firebaseAuth, (user) => {
    if (user) {
        // إذا كان المستخدم مسجل الدخول وهو في صفحة التسجيل، انقله للوحة التحكم
        if (window.location.pathname.includes('index.html') || 
            window.location.pathname.includes('register.html')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // إذا كان المستخدم غير مسجل الدخول وهو في صفحة محمية، انقله للتسجيل
        if (window.location.pathname.includes('dashboard.html') ||
            window.location.pathname.includes('ads.html') ||
            window.location.pathname.includes('referrals.html') ||
            window.location.pathname.includes('withdrawal.html')) {
            window.location.href = 'index.html';
        }
    }
});