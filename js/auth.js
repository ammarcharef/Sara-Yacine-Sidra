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
            console.log('محاولة تسجيل الدخول:', email);
            
            if (!window.firebaseAuth || !window.firebaseFunctions) {
                throw new Error('Firebase not initialized properly');
            }
            
            const userCredential = await window.firebaseFunctions.signInWithEmailAndPassword(
                window.firebaseAuth, email, password
            );
            
            console.log('تم التسجيل بنجاح:', userCredential.user.uid);
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
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
                case 'auth/invalid-login-credentials':
                    errorMessage = 'بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'تم محاولة الدخول مرات كثيرة. حاول لاحقاً';
                    break;
                default:
                    errorMessage = 'حدث خطأ غير متوقع: ' + error.message;
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
        
        if (password.length < 6) {
            alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        
        // إضافة تأثير التحميل
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'جاري إنشاء الحساب...';
        submitBtn.disabled = true;
        
        try {
            console.log('بدء إنشاء حساب جديد:', email);
            
            if (!window.firebaseAuth || !window.firebaseFunctions) {
                throw new Error('Firebase not initialized properly');
            }
            
            // إنشاء المستخدم في Firebase Auth
            const userCredential = await window.firebaseFunctions.createUserWithEmailAndPassword(
                window.firebaseAuth, email, password
            );
            const user = userCredential.user;
            
            console.log('تم إنشاء المستخدم في Auth:', user.uid);
            
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
            await window.firebaseFunctions.setDoc(
                window.firebaseFunctions.doc(window.firebaseDb, "users", user.uid), 
                userData
            );
            
            console.log('تم حفظ بيانات المستخدم في Firestore');
            
            // رسالة نجاح واضحة مع تأخير
            alert('🎉 تم إنشاء الحساب بنجاح! سيتم تحويلك إلى لوحة التحكم...');
            
            // تأخير بسيط ثم التحويل
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            
        } catch (error) {
            console.error('خطأ في إنشاء الحساب:', error);
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
                case 'auth/operation-not-allowed':
                    errorMessage = 'عملية التسجيل غير مسموحة حالياً';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'خطأ في الاتصال بالإنترنت';
                    break;
                default:
                    errorMessage = 'حدث خطأ غير متوقع: ' + error.message;
            }
            alert(errorMessage);
        }
    });
});

// الدخول بحساب Google
window.loginWithGoogle = async function() {
    try {
        console.log('محاولة الدخول بحساب Google');
        
        if (!window.firebaseAuth || !window.firebaseFunctions) {
            throw new Error('Firebase not initialized properly');
        }
        
        const result = await window.firebaseFunctions.signInWithPopup(
            window.firebaseAuth, 
            window.firebaseGoogleProvider
        );
        const user = result.user;
        
        console.log('تم الدخول بحساب Google:', user.uid);
        
        // التحقق إذا كان المستخدم جديداً
        if (result._tokenResponse.isNewUser) {
            console.log('إنشاء حساب جديد لـ Google user');
            // إنشاء حساب جديد مع بيانات Google
            await window.firebaseFunctions.setDoc(
                window.firebaseFunctions.doc(window.firebaseDb, "users", user.uid), 
                {
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
                }
            );
        }
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('خطأ في الدخول بحساب Google:', error);
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
        const q = window.firebaseFunctions.query(
            window.firebaseFunctions.collection(window.firebaseDb, "users"), 
            window.firebaseFunctions.where("referralCode", "==", referralCode)
        );
        const querySnapshot = await window.firebaseFunctions.getDocs(q);
        
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
            await window.firebaseFunctions.updateDoc(
                window.firebaseFunctions.doc(window.firebaseDb, "users", referrerId), 
                {
                    points: window.firebaseFunctions.increment(100),
                    referrals: window.firebaseFunctions.increment(1),
                    referralEarnings: window.firebaseFunctions.increment(100)
                }
            );
            console.log('تم منح مكافأة الإحالة للمستخدم:', referrerId);
        }
    } catch (error) {
        console.error('Error granting referral bonus:', error);
    }
}

// مراقبة حالة المصادقة
if (window.firebaseFunctions && window.firebaseAuth) {
    window.firebaseFunctions.onAuthStateChanged(window.firebaseAuth, (user) => {
        console.log('حالة المصادقة تغيرت:', user ? user.uid : 'لا يوجد مستخدم');
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
} else {
    console.error('لا يمكن تهيئة مراقبة حالة المصادقة - Firebase غير مهيئ');
}
