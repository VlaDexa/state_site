import SurveyNamer from "./SurveyNamer";
import { Renderable, changePage } from "./utils";

export default class Login implements Renderable {
    constructor() { }
    render(): HTMLElement {
        const login = document.createElement("t-login");
        const form = login.shadowRoot!.getElementById('login-form')! as HTMLFormElement;
        form.onsubmit = async (event) => {
            event.preventDefault();
            const data = new FormData(form);
            const email = data.get('email')!;
            const password = data.get('password')!;
            const login_url = "http://api.lapki.vladexa.ru:8000/api/v1/user/token";
            const login_data = {
                "headers": {
                    "content-type": "application/x-www-form-urlencoded",
                },
                "body": `grant_type=&username=${email}&password=${password}&scope=&client_id=&client_secret=`,
                "method": "POST",
            };
            const login = () => fetch(login_url, login_data);
            let req = await login();
            if (req.status !== 200) {
                const register_url = "http://api.lapki.vladexa.ru:8000/api/v1/user/users";
                const register_data = {
                    "headers": {
                        "content-type": "application/json",
                    },
                    "body": `{"nickname":"${email}","password": "${password}"}`,
                    "method": "POST",
                };
                await fetch(register_url, register_data);
                req = await login();
            };
            const log_data = await req.json();
            localStorage.setItem("name", email.toString());
            for (const [key, value] of Object.entries(log_data)) {
                localStorage.setItem(key, value as string);
            }
            changePage(SurveyNamer);
        };
        history.pushState(undefined, "", "login");
        return login;
    }
}
