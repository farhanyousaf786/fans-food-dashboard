class User {
    constructor(name, email, role, code) {
        this.name = name;
        this.email = email;
        this.role = role;
        this.code = code;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    toFirestore() {
        return {
            name: this.name,
            email: this.email,
            role: this.role,
            code: this.code,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromFirestore(data) {
        const user = new User(data.name, data.email, data.role, data.code);
        user.createdAt = data.createdAt?.toDate() || new Date();
        user.updatedAt = data.updatedAt?.toDate() || new Date();
        return user;
    }
}

export default User;
