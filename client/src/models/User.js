class User {
    constructor(name, email, role, code, userId = null) {
        this.name = name;
        this.email = email;
        this.role = role;
        this.code = code;
        this.userId = userId;
        this.fcmTokens = {}; // Object to store FCM tokens per device: { deviceId: token }
        this.shopsId = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    toFirestore() {
        return {
            name: this.name,
            email: this.email,
            role: this.role,
            code: this.code,
            userId: this.userId,
            fcmTokens: this.fcmTokens,
            shopsId: this.shopsId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromFirestore(data, userId = null) {
        const user = new User(data.name, data.email, data.role, data.code, userId || data.userId);
        user.fcmTokens = data.fcmTokens || {};
        user.shopsId = data.shopsId || [];
        user.createdAt = data.createdAt?.toDate() || new Date();
        user.updatedAt = data.updatedAt?.toDate() || new Date();
        return user;
    }

    // Helper methods for FCM token management
    addFCMToken(deviceId, token) {
        console.log('➕ USER MODEL: Adding FCM token for device:', deviceId);
        console.log('➕ USER MODEL: Token preview:', token?.substring(0, 20) + '...');
        this.fcmTokens[deviceId] = token;
        this.updatedAt = new Date();
        console.log('➕ USER MODEL: Total FCM tokens now:', Object.keys(this.fcmTokens).length);
    }

    removeFCMToken(deviceId) {
        console.log('➖ USER MODEL: Removing FCM token for device:', deviceId);
        console.log('➖ USER MODEL: Tokens before removal:', Object.keys(this.fcmTokens));
        delete this.fcmTokens[deviceId];
        this.updatedAt = new Date();
        console.log('➖ USER MODEL: Tokens after removal:', Object.keys(this.fcmTokens));
        console.log('➖ USER MODEL: Total FCM tokens now:', Object.keys(this.fcmTokens).length);
    }

    getFCMTokens() {
        return Object.values(this.fcmTokens);
    }
}

export default User;
