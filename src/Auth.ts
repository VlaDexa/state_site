export default class Auth {
    private constructor(private type: string, private token: string) { }

    public static fromStorage(): Auth | undefined {
        const type = localStorage.getItem("token_type");
        const token = localStorage.getItem("access_token");
        if (type && token) {
            return new Auth(type, token);
        }
        return undefined;
    }

    public static has(): boolean {
        const type = localStorage.getItem("token_type");
        const token = localStorage.getItem("access_token");
        return Boolean(type && token);
    }

    public toAuthorization(): string {
        return `${this.type[0].toUpperCase() + this.type.slice(1)} ${this.token}`;
    }
}

export function getAuth(): string {
    const auth = Auth.fromStorage();
    if (auth) {
        return auth.toAuthorization();
    } else {
        return "";
    }
}
